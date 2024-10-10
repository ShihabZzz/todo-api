import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { prettyJSON } from "hono/pretty-json";

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

const findUser = (userID: string) => {
  return db[userID] || false;
};

const findByTodoID = (db: Todo[], id: string) => {
  return db.find((todo) => todo.id === id) || false;
};

const hasInvalidkeys = (bodyKeys: string[]) => {
  return bodyKeys.some((key) => {
    return key !== "title" && key !== "status";
  });
};

/* Get_All_Todos */
app.get("/:userID/todos", async (c) => {
  try {
    const user = c.req.param("userID");
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
app.get("/:userID/todos/:id", async (c) => {
  try {
    const user = c.req.param("userID");
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
app.post("/:userID/todos", async (c) => {
  try {
    const user = c.req.param("userID");
    const body = await c.req.json();
    if (
      !body.title ||
      body.title.trim() === "" ||
      Number(body.title) ||
      typeof body.title !== "string"
    ) {
      return c.json({ message: "Title is required & must be a string" }, 400);
    }
    const bodyKeys = Object.keys(body);
    const invalidStatusType = body.status && typeof body.status !== "string";
    if (
      hasInvalidkeys(bodyKeys) ||
      invalidStatusType ||
      body.title.length > 100 ||
      body.status?.length > 100
    ) {
      return c.json(
        {
          message:
            hasInvalidkeys(bodyKeys) || invalidStatusType
              ? "Invalid request body"
              : "Title/Status can't exceed 100 characters",
        },
        400
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
      201
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return c.json({ message: "Failed to parse JSON" }, 400);
    }
    return c.json({ message: "Internal Server Error" }, 500);
  }
});

/* Update_A_Todo */
app.put("/:userID/todos/:id", async (c) => {
  try {
    const user = c.req.param("userID");
    const id = c.req.param("id");
    const body = await c.req.json();
    if (!findUser(user) || !findByTodoID(db[user], id)) {
      return c.json({ message: "Todo not found" }, 404);
    }
    const bodyKeys = Object.keys(body);
    const invalidTitleType =
      body.title && (typeof body.title !== "string" || Number(body.title));
    const invalidStatusType =
      body.status && (typeof body.status !== "string");
    if (
      hasInvalidkeys(bodyKeys) ||
      invalidTitleType ||
      invalidStatusType ||
      body.title?.length > 100 ||
      body.status?.length > 100
    ) {
      return c.json(
        {
          message:
            hasInvalidkeys(bodyKeys) || invalidTitleType || invalidStatusType
              ? "Invalid request body"
              : "Title/Status can't exceed 100 characters",
        },
        400
      );
    }
    if (body.title?.trim() === "" || body.status?.trim() === "") {
      return c.json({ message: "Title or Status Can't be empty." }, 400);
    }
    const todoIndex = db[user].findIndex((todo) => todo.id === id);
    const updatedTodo = {
      ...db[user][todoIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    };
    db[user][todoIndex] = updatedTodo;
    return c.json({ message: "Todo updated", updatedTodo }, 200);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return c.json({ message: "Failed to parse JSON" }, 400);
    }
    return c.json({ message: "Internal Server Error" }, 500);
  }
});

/* Delete_A_Todo */
app.delete("/:userID/todos/:id", async (c) => {
  try {
    const user = c.req.param("userID");
    const id = c.req.param("id");
    if (!findUser(user) || !findByTodoID(db[user], id)) {
      return c.json({ message: "Todo not found" }, 404);
    }
    db[user] = db[user].filter((todo) => todo.id !== id);
    return c.json({ message: "Todo deleted successfully" }, 200);
  } catch (error) {
    return c.json({ message: "Internal Server Error" }, 500);
  }
});

/* Delete_All_Todos */
app.delete("/:userID/todos", async (c) => {
  try {
    const user = c.req.param("userID");
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
