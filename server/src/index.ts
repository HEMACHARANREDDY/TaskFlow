import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath, pathToFileURL } from "url";
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
const serverDistPath = path.resolve(__dirname, "../../dist/server/server.js");

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}

if (fs.existsSync(serverDistPath)) {
  try {
    const ssrModule = (await import(pathToFileURL(serverDistPath).href)) as {
      default?: { fetch: (req: Request, env?: unknown, ctx?: unknown) => Promise<Response> };
    };
    const ssrHandler = ssrModule.default;

    if (ssrHandler && typeof ssrHandler.fetch === "function") {
      app.use(async (req, res, next) => {
        if (req.path.startsWith("/api")) {
          return next();
        }

        try {
          const proto = req.headers["x-forwarded-proto"] || req.protocol || "http";
          const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
          const url = new URL(req.originalUrl || req.url, `${proto}://${host}`);

          const headers = new Headers();
          for (const [key, val] of Object.entries(req.headers)) {
            if (val) {
              headers.set(key, Array.isArray(val) ? val.join(", ") : val);
            }
          }

          const webReq = new Request(url.toString(), {
            method: req.method,
            headers,
          });

          const webRes = await ssrHandler.fetch(webReq, {}, {});
          res.status(webRes.status);
          webRes.headers.forEach((value, headerKey) => {
            res.setHeader(headerKey, value);
          });

          const text = await webRes.text();
          return res.send(text);
        } catch (ssrErr) {
          console.error("[SSR Error]:", ssrErr);
          next();
        }
      });
    }
  } catch (err) {
    console.warn("[SSR] Could not load SSR module:", err);
  }
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
