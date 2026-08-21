# TaskFlow

TaskFlow is an enterprise-grade task management and productivity analytics platform. Built with React 19, TanStack Router, Tailwind CSS, and a Node.js/Express REST backend on MongoDB, TaskFlow provides task lifecycle management, automated productivity calculations, and search infrastructure.

---

## Architectural Overview

```
taskflow/
├── src/                    # Frontend client (React 19, TanStack Start/Router, Tailwind CSS)
│   ├── components/         # Design system & shared UI primitives
│   ├── lib/                # API client, auth context, theme, and utility functions
│   └── routes/             # File-based application routes (Landing, Auth, Dashboard, Tasks, Analytics)
├── server/                 # RESTful backend API (Node.js, Express, TypeScript)
│   ├── src/
│   │   ├── config/         # Database and environment configurations
│   │   ├── controllers/    # Request handlers for auth, tasks, and analytics
│   │   ├── middleware/     # JWT authentication, authorization, and error handling
│   │   ├── models/         # Mongoose data schemas and database indexes
│   │   └── routes/         # Express endpoint definitions
│   ├── postman_collection.json # Complete Postman API test collection
│   └── README.md           # Backend API documentation
└── public/                 # Static assets, robots.txt, sitemap.xml, and llms.txt
```

---

## Key Features

### Authentication and Access Control

- JWT-based authentication with encrypted bearer token verification.
- Password hashing using `bcryptjs` (salt rounds: 10).
- Google OAuth 2.0 Single Sign-On via Google Identity Services.
- Role-based authorization (`user`, `admin`).

### Task Management Infrastructure

- Complete CRUD operations with atomic database updates.
- Compound filtering by status (`todo`, `in_progress`, `done`) and priority (`low`, `medium`, `high`).
- Full-text search across titles and descriptions backed by text indexes.
- Dynamic multi-criteria sorting (Creation Date, Due Date, Priority Weight).
- Offset and limit pagination for high-volume dataset handling.

### Productivity Analytics Engine

- Rolling 7-day productivity velocity and daily completion metrics.
- 30-day cumulative trend modeling.
- Distribution breakdown by priority and execution status.
- Automated client-side and server-side aggregation fallbacks.

### User Interface and Experience

- Theme system supporting light, dark, and system preference modes with persistent storage.
- Micro-interactions and layout transitions via Framer Motion.
- Responsive layout adapting from mobile views to desktop sidebars.
- Interactive Pomodoro focus timer with session tracking.

---

## Technology Stack

| Layer               | Technologies                                                          |
| :------------------ | :-------------------------------------------------------------------- |
| **Frontend Core**   | React 19, TypeScript, TanStack Start, TanStack Router, TanStack Query |
| **Styling & UI**    | Tailwind CSS, Radix UI Primitives, Lucide Icons                       |
| **Visualization**   | Recharts Data Visualization Library                                   |
| **Backend Runtime** | Node.js, Express.js, TypeScript                                       |
| **Database & ODM**  | MongoDB, Mongoose                                                     |
| **Security & Auth** | JSON Web Tokens (JWT), Google OAuth 2.0, bcryptjs                     |

---

## Getting Started

### Prerequisites

- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)
- MongoDB instance (local or MongoDB Atlas)

### Installation

1. Clone the repository and install dependencies:

   ```bash
   npm install
   ```

2. Configure environment variables:

   ```bash
   cp .env.example .env
   ```

3. Update the `.env` file with your configuration:
   ```env
   # Backend Configuration
   PORT=5000
   MONGODB_URI="mongodb://127.0.0.1:27017/taskflow_db"
   JWT_SECRET="your_secure_jwt_secret_key"
   VITE_API_URL="http://localhost:5000/api"

   # Google OAuth Credentials
   GOOGLE_CLIENT_ID="your_google_client_id"
   GOOGLE_CLIENT_SECRET="your_google_client_secret"
   VITE_GOOGLE_CLIENT_ID="your_google_client_id"
   ```

---

## Development Scripts

| Command              | Description                                                        |
| :------------------- | :----------------------------------------------------------------- |
| `npm run dev:all`    | Runs frontend (`:8080`) and Express backend (`:5000`) concurrently |
| `npm run dev`        | Runs frontend client development server                            |
| `npm run server`     | Runs Node.js / Express backend server                              |
| `npm run server:dev` | Runs backend server with hot-reload watch mode                     |
| `npm run build`      | Compiles client bundle and SSR build for production                |
| `npm run format`     | Formats all code files using Prettier                              |
| `npm run lint`       | Analyzes code for quality and style rule compliance                |

---

## Deployment on Render

This repository is pre-configured for automated deployment on [Render](https://render.com) using the included `render.yaml` blueprint.

### Option 1: Blueprint Deployment (Recommended)

1. Go to your [Render Dashboard](https://dashboard.render.com/) and click **New > Blueprint**.
2. Connect your repository: `https://github.com/HEMACHARANREDDY/TaskFlow`.
3. Render will detect `render.yaml` and configure the build and start commands automatically.
4. Set your `MONGODB_URI` environment variable and click **Apply**.

### Option 2: Manual Web Service Setup

1. In Render, select **New > Web Service**.
2. Connect your repository and configure:
   - **Environment**: `Node`
   - **Build Command**: `npm install --include=dev && npm run build`
   - **Start Command**: `npm run server`
3. Add environment variables:
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `<your_mongodb_connection_string>`
   - `JWT_SECRET`: `<your_secure_jwt_secret>`
   - `GOOGLE_CLIENT_ID`: `<your_google_client_id>`
   - `GOOGLE_CLIENT_SECRET`: `<your_google_client_secret>`
4. Click **Deploy Web Service**.

---

## API Documentation

For the complete REST API specification, endpoint schemas, query parameters, and Postman import instructions, refer to [`server/README.md`](file:///c:/Users/Charan/Desktop/projetcs/Flow%20State/server/README.md).

---

## License

This project is licensed under the MIT License.
