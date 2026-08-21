import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
void connectDB();

// Middleware
app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (process.env.NODE_ENV !== "production") {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: "TaskFlow Full Stack Backend API",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/analytics", analyticsRoutes);

// Serve static frontend in production if built
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, "../../dist/client");

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api")) {
      return res.sendFile(path.join(clientDistPath, "index.html"));
    }
    next();
  });
}

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Start listening
const server = app.listen(PORT, () => {
  console.log(`=============================================`);
  console.log(`🚀 TaskFlow Backend running on port ${PORT}`);
  console.log(`📡 URL: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth Endpoints: http://localhost:${PORT}/api/auth`);
  console.log(`📋 Tasks Endpoints: http://localhost:${PORT}/api/tasks`);
  console.log(`📊 Analytics Endpoints: http://localhost:${PORT}/api/analytics`);
  console.log(`=============================================`);
});

export default app;
