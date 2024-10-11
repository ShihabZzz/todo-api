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

const bodyTitleValidation = (body: any): { valid: boolean; message?: string } => {
  const bodyKeys = Object.keys(body);
  switch (true) {
    case (!bodyKeys.includes("title")):
      return { valid: false, message: "Title is required" };
    case typeof body.title !== "string" || body.title.trim() === "" || !isNaN(body.title):
      return { valid: false, message: "Title must be valid string type" };
    case body.title.length > 100:
      return { valid: false, message: "Title can't exceed 100 characters" };
    default:
      return { valid: true };
  }
};

const bodyStatusValidation = (body: any): { valid: boolean; message?: string } => {
  const bodyKeys = Object.keys(body);
  switch (true) {
    case bodyKeys.includes("status") && (typeof body.status !== "string" || body.status.trim() === ""):
      return { valid: false, message: "Status must be a valid string type" };
    case body.status?.length > 50:
      return { valid: false, message: "Status can't exceed 50 characters" };
    default:
      return { valid: true };
  }
}

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
    const bodyKeys = Object.keys(body);
    if (hasInvalidkeys(bodyKeys)) {
      return c.json({
        message: "Invalid request body",
      }, 400);
    }
    const titleValidation = bodyTitleValidation(body);
    if (!titleValidation.valid) {
      return c.json({ message: titleValidation.message }, 400);
    }
    const statusValidation = bodyStatusValidation(body);
    if (!statusValidation.valid) {
      return c.json({ message: statusValidation.message }, 400);
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
    if (hasInvalidkeys(bodyKeys) || bodyKeys.length === 0) {
      return c.json({ message: "Invalid request body" }, 400);
    }
    const titleValidation = bodyTitleValidation(body);
    if (bodyKeys.includes('title') && !titleValidation.valid) {
      return c.json({ message: titleValidation.message }, 400);
    }
    const statusValidation = bodyStatusValidation(body);
    if (!statusValidation.valid) {
      return c.json({ message: statusValidation.message }, 400);
    }
    const todoIndex = db[user].findIndex((todo) => todo.id === id);
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
