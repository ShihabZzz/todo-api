# TodoAPI

# TodoAPI

TodoAPI is a simple RESTful API for managing todo items. It allows users to create, read, update, and delete todos. The API is built using the Hono framework and runs on Node.js.

## Features

- Create a new todo
- Get all todos for a user
- Get a specific todo by ID
- Update a todo
- Delete a todo
- Delete all todos for a user

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository

2. Install the dependencies:
    ```sh
    npm install
    ```

3. Start the server:
    ```sh
    npm run dev
    ```

### Usage

Once the server is running, you can use tools like Postman or curl to interact with the API. The base URL for the API is `http://localhost:3000`.

### Endpoints
Replace `userID` and `id` with the appropriate values.

- `GET /:userID/todos` - Get all todos for a user
    ```sh
    curl -X GET http://localhost:3000/{userID}/todos
    ```
- `GET /:userID/todos/:id` - Get a specific todo by ID
    ```sh
    curl -X GET http://localhost:3000/{userID}/todos/{id}
    ```
- `POST /:userID/todos` - Create a new todo
    ```sh
    curl -X POST http://localhost:3000/{userID}/todos -H "Content-Type: application/json" -d '{"title":"New Todo","status":"todo"}'
    ```
- `PUT /:userID/todos/:id` - Update a todo
    ```sh
    curl -X PUT http://localhost:3000/{userID}/todos/{id} -H "Content-Type: application/json" -d '{"title":"Updated Todo","status":"Completed"}'
    ```
- `DELETE /:userID/todos/:id` - Delete a todo
    ```sh
    curl -X DELETE http://localhost:3000/{userID}/todos/{id}
    ```
- `DELETE /:userID/todos` - Delete all todos for a user
    ```sh
    curl -X DELETE http://localhost:3000/{userID}/todos
    ```

### Contributing

Contributions are welcome! Please fork the repository and submit a pull request.
