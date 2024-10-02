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

// get all todos
app.get('/:userID/todos', async (c) => {
  try {
    const user = c.req.param('userID')
    if (!(`${user}` in db)) {
      return c.json({ message: "User not found" }, 404)
    }
    const data = db[user]
    return c.json(data)
  } catch (error) {
    return c.json({ message: "Internal Server Error" }, 500)
  }
})

// get todo by id
app.get('/:userID/todos/:id', async (c) => {
  try {
    const user = c.req.param('userID')
    const id = c.req.param('id')
    if (!(`${user}` in db) || db[user].find(todo => todo.id === id) === undefined) {
      return c.json({ message: "Todo not found" }, 404)
    }
    const data = db[user].find(todo => todo.id === id)
    return c.json(data)
  } catch (error) {
    return c.json({ message: "Internal Server Error" }, 500)
  }
})

// create/POST a todo
app.post('/:userID/todos', async (c) => {
  try {
    const user = c.req.param('userID')
    const body = await c.req.json()
    if (!body.title) {
      return c.json({ message: "Title is required" }, 400)
    } else if (body.id || body.status || body.createdAt || body.updatedAt) {
      return c.json({ message: "Invalid request body" }, 400)
    }
    const newTodo: Todo = {
      title: body.title,
      id: crypto.randomUUID(),
      status: "todo",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    if (!(`${user}` in db)) {
      db[user] = []
    }
    db[user].push(newTodo)
    return c.json(newTodo, 201)
  } catch (error) {
    return c.json({ message: "Internal Server Error" }, 500)
  }
})

// update/PUT a todo
app.put('/:userID/todos/:id', async (c) => {
  try {
    const user = c.req.param('userID')
    const id = c.req.param('id')
    const body = await c.req.json()
    if (!(`${user}` in db) || db[user].find(todo => todo.id === id) === undefined) {
      return c.json({ message: "Todo not found" }, 404)
    }
    if (body.id || body.createdAt || body.updatedAt) {
      return c.json({ message: "Invalid request body" }, 400)
    }
    const todoIndex = db[user].findIndex(todo => todo.id === id)
    const updatedTodo = {
      ...db[user][todoIndex],
      ...body,
      updatedAt: new Date().toISOString()
    }
    db[user][todoIndex] = updatedTodo
    return c.json(updatedTodo, 200)
  } catch (error) {
    return c.json({ message: "Internal Server Error" }, 500)
  }
})

// delete a todo
app.delete('/:userID/todos/:id', async (c) => {
  try {
    const user = c.req.param('userID')
    const id = c.req.param('id')
    if (!(`${user}` in db) || db[user].find(todo => todo.id === id) === undefined) {
      return c.json({ message: "Todo not found" }, 404)
    }
    db[user] = db[user].filter(todo => todo.id !== id)
    return c.json({ message: "Todo deleted successfully" }, 200)
  } catch (error) {
    return c.json({ message: "Internal Server Error" }, 500)
  }
})

// delete all todos
app.delete('/:userID/todos', async (c) => {
  try {
    const user = c.req.param('userID')
    if (!(`${user}` in db)) {
      return c.json({ message: "User not found" }, 404)
    }
    db[user] = []
    return c.json({ message: "All todos deleted successfully" }, 200)
  } catch (error) {
    return c.json({ message: "Internal Server Error" }, 500)
  }
})

const port = 3000
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})
