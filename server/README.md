# TaskFlow REST API Specification

A RESTful backend service built with Node.js, Express, TypeScript, and MongoDB for the TaskFlow workspace.

---

## Technical Specifications

- **Runtime Environment**: Node.js & TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT Bearer Tokens with `bcryptjs` password encryption
- **Authorization**: Role-Based Access Control (`user`, `admin`)
- **Error Handling**: Centralized error middleware supporting Mongoose Validation Errors, Cast Errors, and Duplicate Key Constraints (`E11000`)

---

## Execution Instructions

### Running Standalone Backend

```bash
# Production runtime with TypeScript execution
npm run server

# Development runtime with watch mode
npm run server:dev
```

### Running Complete Stack

```bash
npm run dev:all
```

Default Base URL: `http://localhost:5000`

---

## Endpoint Specifications

### 1. Health Verification

#### `GET /api/health`

- **Authentication**: None
- **Response**:
  ```json
  {
    "status": "ok",
    "timestamp": "2026-08-21T07:30:00.000Z",
    "uptime": 124.5
  }
  ```

---

### 2. Authentication Endpoints (`/api/auth`)

| Method | Route                | Description                                         |   Auth Required    |
| :----- | :------------------- | :-------------------------------------------------- | :----------------: |
| `POST` | `/api/auth/register` | Register a new user (`name`, `email`, `password`)   |         No         |
| `POST` | `/api/auth/login`    | Authenticate user and issue JWT Bearer Token        |         No         |
| `POST` | `/api/auth/google`   | Exchange and verify Google OAuth 2.0 Identity Token |         No         |
| `GET`  | `/api/auth/me`       | Fetch profile details of current authenticated user | Yes (Bearer Token) |

#### Example Request: `POST /api/auth/login`

```json
{
  "email": "developer@example.com",
  "password": "SecurePassword123!"
}
```

#### Example Response:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "66c4c3f5d1e2b4a0f8e91234",
    "name": "Developer",
    "email": "developer@example.com",
    "role": "user"
  }
}
```

---

### 3. Task Management Endpoints (`/api/tasks`)

| Method   | Route                   | Description                                                                  | Auth Required |
| :------- | :---------------------- | :--------------------------------------------------------------------------- | :-----------: |
| `GET`    | `/api/tasks`            | List tasks with search, filtering, sorting, and pagination                   |      Yes      |
| `POST`   | `/api/tasks`            | Create a new task record                                                     |      Yes      |
| `GET`    | `/api/tasks/:id`        | Fetch specific task by database ID                                           |      Yes      |
| `PUT`    | `/api/tasks/:id`        | Update task fields (`title`, `description`, `status`, `priority`, `dueDate`) |      Yes      |
| `PATCH`  | `/api/tasks/:id/status` | Update execution status (`todo`, `in_progress`, `done`)                      |      Yes      |
| `DELETE` | `/api/tasks/:id`        | Remove a task record                                                         |      Yes      |
| `POST`   | `/api/tasks/seed`       | Seed realistic demo task dataset for the current user                        |      Yes      |

#### Query Parameters for `GET /api/tasks`

- `search` _(string)_: Keyword search across title and description.
- `status` _(string)_: Filter by `todo`, `in_progress`, `done`, or `all`.
- `priority` _(string)_: Filter by `low`, `medium`, `high`, or `all`.
- `sort` _(string)_: Sort by `newest`, `oldest`, `due`, or `priority`.
- `page` _(number)_: Pagination page index (default: `1`).
- `limit` _(number)_: Records per page (default: `10`).

---

### 4. Analytics Endpoints (`/api/analytics`)

#### `GET /api/analytics`

- **Authentication**: Bearer Token
- **Description**: Returns workspace metrics including task counts, completion rate percentage, priority distributions, rolling 7-day output, and 30-day cumulative trend.
- **Example Response**:
  ```json
  {
    "total": 8,
    "completed": 4,
    "pending": 4,
    "completionRate": 50,
    "statusBreakdown": [
      { "status": "todo", "count": 2 },
      { "status": "in_progress", "count": 2 },
      { "status": "done", "count": 4 }
    ],
    "priorityBreakdown": [
      { "priority": "high", "count": 3 },
      { "priority": "medium", "count": 3 },
      { "priority": "low", "count": 2 }
    ],
    "weeklyProductivity": [
      { "day": "2026-08-15", "completed": 1 },
      { "day": "2026-08-16", "completed": 0 },
      { "day": "2026-08-17", "completed": 2 }
    ]
  }
  ```

---

## Database Index Configuration

Defined in [`server/src/models/Task.ts`](file:///c:/Users/Charan/Desktop/projetcs/Flow%20State/server/src/models/Task.ts):

- Compound Index: `{ user: 1, status: 1 }`
- Compound Index: `{ user: 1, priority: 1 }`
- Compound Index: `{ user: 1, dueDate: 1 }`
- Compound Index: `{ user: 1, createdAt: -1 }`
- Text Search Index: `{ title: "text", description: "text" }`

---

## Postman Collection Import

Import [`server/postman_collection.json`](file:///c:/Users/Charan/Desktop/projetcs/Flow%20State/server/postman_collection.json) directly into Postman to access pre-configured test requests for all endpoints.
