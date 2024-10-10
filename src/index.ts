import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { prettyJSON } from 'hono/pretty-json'

const app = new Hono()
app.use(prettyJSON())

interface Todo {
  title: string;
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}
const db: Record<string, Todo[]> = {};

const findUser = (userID: string) => {
  return db[userID] || false
}

const findByTodoID = (db: Todo[], id: string) => {
  return db.find(todo => todo.id === id) || false
}

/* Get_All_Todos */
app.get('/:userID/todos', async (c) => {
  try {
    const user = c.req.param('userID')
    if (!findUser(user)) {
      return c.json({ message: "User not found" }, 404)
    }
    const data = db[user]
    return c.json(data)
  } catch (error) {
    return c.json({ message: "Internal Server Error" }, 500)
  }
})

/* Get_A_Todo */
app.get('/:userID/todos/:id', async (c) => {
  try {
    const user = c.req.param('userID')
    const id = c.req.param('id')
    if (!findUser(user) || !findByTodoID(db[user], id)) {
      return c.json({ message: "Todo not found" }, 404)
    }
    const data = db[user].find(todo => todo.id === id)
    return c.json(data)
  } catch (error) {
    return c.json({ message: "Internal Server Error" }, 500)
  }
})

/* Create_A_Todo */
app.post('/:userID/todos', async (c) => {
  try {
    const user = c.req.param('userID')
    const body = await c.req.json()
    if (!body.title || body.title.trim() === "") {
      return c.json({ message: "Title is required" }, 400)
    }
    const bodyKeys = Object.keys(body);
    const hasInvalidkeys = bodyKeys.some((key) => {
      return key !== "title" && key !== "status"
    })
    if (hasInvalidkeys) {
      return c.json({ message: "Invalid request body" }, 400)
    }
    const newTodo: Todo = {
      title: body.title,
      id: crypto.randomUUID(),
      status: body.status || "todo",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    if (!(`${user}` in db)) {
      db[user] = []
    }
    db[user].push(newTodo)
    return c.json({ message: "Todo created", newTodo }, 201)
  } catch (error) {
    return c.json({ message: "Internal Server Error" }, 500)
  }
})

/* Update_A_Todo */
app.put('/:userID/todos/:id', async (c) => {
  try {
    const user = c.req.param('userID')
    const id = c.req.param('id')
    const body = await c.req.json()
    if (!findUser(user) || !findByTodoID(db[user], id)) {
      return c.json({ message: "Todo not found" }, 404)
    }
    const bodyKeys = Object.keys(body);
    const hasInvalidkeys = bodyKeys.some((key) => {
      return key !== "title" && key !== "status"
    })
    if (hasInvalidkeys) {
      return c.json({ message: "Invalid request body" }, 400)
    }
    if (!body.title || body.title.trim() === "" || !body.status || body.status.trim() === "") {
      return c.json({ message: "Title or Status Can't be empty." }, 400)
    }
    const todoIndex = db[user].findIndex(todo => todo.id === id)
    const updatedTodo = {
      ...db[user][todoIndex],
      ...body,
      updatedAt: new Date().toISOString()
    }
    db[user][todoIndex] = updatedTodo
    return c.json({ message: "Todo updated", updatedTodo }, 200)
  } catch (error) {
    return c.json({ message: "Internal Server Error" }, 500)
  }
})

/* Delete_A_Todo */
app.delete('/:userID/todos/:id', async (c) => {
  try {
    const user = c.req.param('userID')
    const id = c.req.param('id')
    if (!findUser(user) || !findByTodoID(db[user], id)) {
      return c.json({ message: "Todo not found" }, 404)
    }
    db[user] = db[user].filter(todo => todo.id !== id)
    return c.json({ message: "Todo deleted successfully" }, 200)
  } catch (error) {
    return c.json({ message: "Internal Server Error" }, 500)
  }
})

/* Delete_All_Todos */
app.delete('/:userID/todos', async (c) => {
  try {
    const user = c.req.param('userID')
    if (!findUser(user)) {
      return c.json({ message: "User not found" }, 404)
    }
    db[user] = []
    return c.json({ message: "All todos deleted successfully" }, 200)
  } catch (error) {
    return c.json({ message: "Internal Server Error" }, 500)
  }
})

const port = process.env.PORT ? +(process.env.PORT) : 3000
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})
