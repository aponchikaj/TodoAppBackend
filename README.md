# Todo API — Backend

A REST API for a todo app I built. Has user auth with httpOnly cookies and full CRUD for todos. Each user can only see and modify their own todos.

## Stack

- Node.js (ES Modules)
- Express 5
- MongoDB + Mongoose
- JWT stored in httpOnly cookies
- bcrypt for password hashing
- Helmet + CORS for basic security
- Morgan for logging
- Jest + Supertest + mongodb-memory-server for tests

## Getting started

**1. Clone and install dependencies**

```bash
git clone https://github.com/aponchikaj/TodoAppBackend
cd backend
npm install
```

**2. Set up your `.env`**

```bash
cp .env.example .env
```

Then open the `.env` file and fill in the values (see the table below).

**3. Run locally**

```bash
npm run dev
```

**4. Run in production**

```bash
npm start
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Port the server runs on (default: 3000) |
| `NODE_ENV` | Yes | `development` or `production` |
| `MONGO_STRING` | Yes | Your MongoDB connection string |
| `JWT_SECRET` | Yes | Secret used to sign tokens — make it long and random |
| `BCRYPT_SALT_ROUNDS` | No | bcrypt rounds (default: 12) |
| `CLIENT_URL` | Yes | Your frontend URL, needed for CORS (e.g. `http://localhost:5173`) |

`.env.example` (safe to commit):

```
PORT=3000
NODE_ENV=development
MONGO_STRING=mongodb+srv://<user>:<password>@cluster.mongodb.net/<dbname>
JWT_SECRET=replace_with_a_long_random_secret
BCRYPT_SALT_ROUNDS=12
CLIENT_URL=http://localhost:5173
```

## Tests

Tests run against an in-memory MongoDB so you don't need a real database or `.env` file to run them.

```bash
npm test
```

There are 55 test cases covering auth and todos, including checks that make sure users can't access each other's data.

## API

All responses look like this:

```json
{ "Success": true, "Message": <data or string> }
{ "Success": false, "Message": "<error description>" }
```

Auth is handled via an httpOnly cookie called `userToken` that gets set automatically when you register or log in. Routes marked with 🔒 need this cookie.

---

### Auth — `/api/auth`

#### `POST /api/auth/register`

Creates a new account and sets the auth cookie.

**Body**
```json
{
  "username": "lazare",
  "email": "lazare@example.com",
  "password": "Test@1234"
}
```

**Validation**
- `username` — 3–20 chars, only letters/numbers/underscores
- `email` — valid email
- `password` — at least 8 chars, needs uppercase, lowercase, a number, and a special char (`@$!%*?&`)

**Response**
```json
{ "Success": true, "Message": "Registered successfully" }
```

---

#### `POST /api/auth/login`

You can log in with either your email or username in the `user` field.

**Body**
```json
{ "user": "lazare@example.com", "password": "Test@1234" }
```
or
```json
{ "user": "lazare", "password": "Test@1234" }
```

**Response**
```json
{ "Success": true, "Message": "Logged in" }
```

---

#### `POST /api/auth/logout` 🔒

Clears the auth cookie.

**Response**
```json
{ "Success": true, "Message": "Logged out" }
```

---

#### `GET /api/auth/me` 🔒

Returns the current user's info (password not included).

**Response**
```json
{
  "Success": true,
  "Message": {
    "_id": "...",
    "username": "lazare",
    "email": "lazare@example.com",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### User — `/api`

#### `GET /api/me` 🔒

Same as `GET /api/auth/me`.

---

#### `PUT /api/password` 🔒

Changes your password.

**Body**
```json
{ "oldPassword": "Test@1234", "password": "NewPass@5678" }
```

**Response**
```json
{ "Success": true, "Message": "Saved." }
```

---

#### `DELETE /api/me` 🔒

Permanently deletes your account and all your todos.

**Response**
```json
{ "Success": true, "Message": "Deleted." }
```

---

### Todos — `/api/todos` 🔒

All todo routes require authentication. You can only access your own todos.

#### `GET /api/todos`

Returns your todos with pagination.

**Query params**

| Param | Type | Description |
|---|---|---|
| `status` | string | Filter by `To Do`, `In Progress`, or `Done` |
| `priority` | string | Filter by `low`, `medium`, or `high` |
| `search` | string | Search in title and description (case-insensitive) |
| `sort` | string | `createdAt`, `updatedAt`, `dueDate`, `priority`, or `title` (default: `createdAt`) |
| `order` | string | `asc` or `desc` (default: `desc`) |
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page, max 100 (default: 10) |

**Response**
```json
{
  "Success": true,
  "Message": [ ...todos ],
  "Pagination": {
    "total": 25,
    "totalPages": 3,
    "currentPage": 1,
    "limit": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

#### `POST /api/todos`

Creates a new todo.

**Body**
```json
{
  "title": "Buy groceries",
  "description": "Milk and eggs",
  "status": "To Do",
  "priority": "medium",
  "dueDate": "2025-12-31"
}
```

`description` and `dueDate` are optional. `status` defaults to `To Do` and `priority` defaults to `medium`.

**Validation**
- `title` — required, max 200 characters
- `status` — must be `To Do`, `In Progress`, or `Done`
- `priority` — must be `low`, `medium`, or `high`
- `dueDate` — ISO date string, can't be in the past

---

#### `GET /api/todos/:id`

Returns a single todo. Returns 404 if it doesn't exist or belongs to someone else.

---

#### `PUT /api/todos/:id`

Updates a todo. Returns 404 if not found or not yours. All fields are required on update (same as POST).

---

#### `DELETE /api/todos/:id`

Deletes a todo. Returns 404 if not found or not yours.

---

### Todo schema

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Auto-generated |
| `userID` | ObjectId | Owner |
| `todoTitle` | String | Required, max 200 chars |
| `todoDescription` | String | Optional |
| `status` | String | `To Do` / `In Progress` / `Done` |
| `priority` | String | `low` / `medium` / `high` |
| `dueDate` | Date | Optional |
| `createdAt` | Date | Auto |
| `updatedAt` | Date | Auto |

## Author

Lazare Mirziashvili