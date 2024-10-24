import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { prettyJSON } from "hono/pretty-json";
import { z } from "zod";

const app = new Hono();
app.use(prettyJSON());

interface Todo {
  title: string;
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}
const db: Record<string, Todo[]> = {};

const findUser = (user: string) => {
  return db[user] || false;
};

const findByTodoID = (db: Todo[], id: string) => {
  return db.find((todo) => todo.id === id) || false;
};

const findTodoIndex = (db: Todo[], id: string) => {
  return db.findIndex((todo) => todo.id === id);
};

const hasInvalidkeys = (bodyKeys: string[]) => {
  return bodyKeys.some((key) => {
    return key !== "title" && key !== "status";
  });
};

const titleValidation = z
  .string({ required_error: "title is required" })
  .min(3, { message: "title must be at least 3 characters" })
  .max(100, { message: "title must not exceed 100 characters" })
  .refine((title) => title.trim() !== "" && isNaN(Number(title)), {
    message: "title must be valid string type",
  });

const statusValidation = z
  .string()
  .min(3, { message: "status must be at least 3 characters" })
  .max(50, { message: "status must not exceed 50 characters" })
  .refine((status) => status.trim() !== "", {
    message: "status must be valid string type",
  })
  .optional();

/* Get_All_Todos */
app.get("/:user/todos", async (c) => {
  try {
    const user = c.req.param("user");
    if (!findUser(user)) {
      return c.json({ message: "User not found" }, 404);
    }
    const data = db[user];
    return c.json(data);
  } catch (error) {
    return c.json({ message: "Internal Server Error" }, 500);
  }
});

/* Get_A_Todo */
app.get("/:user/todos/:id", async (c) => {
  try {
    const user = c.req.param("user");
    const id = c.req.param("id");
    if (!findUser(user) || !findByTodoID(db[user], id)) {
      return c.json({ message: "Todo not found" }, 404);
    }
    const data = db[user].find((todo) => todo.id === id);
    return c.json(data);
  } catch (error) {
    return c.json({ message: "Internal Server Error" }, 500);
  }
});

/* Create_A_Todo */
app.post("/:user/todos", async (c) => {
  try {
    const user = c.req.param("user");
    const body = await c.req.json();
    const bodyKeys = Object.keys(body);
    if (hasInvalidkeys(bodyKeys)) {
      return c.json(
        {
          message: "Invalid request body",
        },
        400,
      );
    }
    const titleValidationResult = titleValidation.safeParse(body.title);
    if (!titleValidationResult.success) {
      return c.json(
        { message: titleValidationResult.error.errors[0].message },
        400,
      );
    }
    const statusValidationResult = statusValidation.safeParse(body.status);
    if (!statusValidationResult.success) {
      return c.json(
        { message: statusValidationResult.error.errors[0].message },
        400,
      );
    }
    const todo: Todo = {
      title: body.title,
      id: crypto.randomUUID(),
      status: body.status || "todo",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (!findUser(user)) {
      db[user] = [];
    }
    db[user].push(todo);
    return c.json<{ message: string; todo: Todo }>(
      { message: "Todo created", todo },
      201,
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return c.json({ message: "Failed to parse JSON" }, 400);
    }
    return c.json({ message: "Internal Server Error" }, 500);
  }
});

/* Update_A_Todo */
app.put("/:user/todos/:id", async (c) => {
  try {
    const user = c.req.param("user");
    const id = c.req.param("id");
    const body = await c.req.json();
    if (!findUser(user) || !findByTodoID(db[user], id)) {
      return c.json({ message: "Todo not found" }, 404);
    }
    const bodyKeys = Object.keys(body);
    const validations = [
      {
        valid: !hasInvalidkeys(bodyKeys) && bodyKeys.length > 0,
        message: "Invalid request body",
      },
      {
        valid:
          !bodyKeys.includes("title") ||
          titleValidation.safeParse(body.title).success,
        message: titleValidation.safeParse(body.title).error?.errors[0].message,
      },
      {
        valid: statusValidation.safeParse(body.status).success,
        message: statusValidation.safeParse(body.status).error?.errors[0]
          .message,
      },
    ];
    for (const validation of validations) {
      if (!validation.valid) {
        return c.json({ message: validation.message }, 400);
      }
    }
    const todoIndex = findTodoIndex(db[user], id);
    const todo = {
      ...db[user][todoIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    };
    db[user][todoIndex] = todo;
    return c.json({ message: "Todo updated", todo }, 200);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return c.json({ message: "Failed to parse JSON" }, 400);
    }
    return c.json({ message: "Internal Server Error" }, 500);
  }
});

/* Delete_A_Todo */
app.delete("/:user/todos/:id", async (c) => {
  try {
    const user = c.req.param("user");
    const id = c.req.param("id");
    if (!findUser(user) || !findByTodoID(db[user], id)) {
      return c.json({ message: "Todo not found" }, 404);
    }
    db[user].splice(findTodoIndex(db[user], id), 1);
    return c.json({ message: "Todo deleted successfully" }, 200);
  } catch (error) {
    return c.json({ message: "Internal Server Error" }, 500);
  }
});

/* Delete_All_Todos */
app.delete("/:user/todos", async (c) => {
  try {
    const user = c.req.param("user");
    if (!findUser(user)) {
      return c.json({ message: "User not found" }, 404);
    }
    db[user] = [];
    return c.json({ message: "All todos deleted successfully" }, 200);
  } catch (error) {
    return c.json({ message: "Internal Server Error" }, 500);
  }
});

const port = process.env.PORT ? +process.env.PORT : 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
