import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./lib/env.js";
import { prisma } from "./lib/prisma.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorMiddleware } from "./middleware/errorMiddleware.js";
import { devLogRoutes } from "./routes/devLogRoutes.js";
import { authRoutes } from "./routes/auth.routes.js";

export const app = express();

app.disable("etag");

app.use(requestLogger);

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true
  })
);

app.use(express.json());
app.use(cookieParser());


if (env.NODE_ENV === "development" && env.ENABLE_DEV_LOG_VIEWER) {
  app.use("/dev/logs", devLogRoutes);
}

app.use("/auth", authRoutes);

app.get("/", (_req, res) => {
  res.set("Cache-Control", "no-store");
  res.type("html").send(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Mini Jira API</title>
        <style>
          body {
            font-family: system-ui, sans-serif;
            max-width: 720px;
            margin: 48px auto;
            line-height: 1.5;
          }

          code {
            background: #f3f4f6;
            padding: 2px 6px;
            border-radius: 4px;
          }

          li {
            margin-bottom: 8px;
          }
        </style>
      </head>
      <body>
        <h1>Mini Jira API</h1>
        <p>The backend server is running.</p>

        <h2>Available development routes</h2>
        <ul>
          <li><a href="/health"><code>GET /health</code></a></li>
          <li><a href="/health/db"><code>GET /health/db</code></a></li>
          <li><a href="/dev/logs"><code>GET /dev/logs</code></a></li>
          <li><a href="/dev/logs/json"><code>GET /dev/logs/json</code></a></li>
        </ul>

        <p>Frontend should run separately at <code>http://localhost:5173</code>.</p>
      </body>
    </html>
  `);
});

app.get("/health", (_req, res) => {
  res.set("Cache-Control", "no-store");
  res.status(200).json({ status: "ok" });
});

app.get("/health/db", async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.set("Cache-Control", "no-store");
    res.status(200).json({
      status: "ok",
      database: "connected"
    });
  } catch (error) {
    next(error);
  }
});

app.use(errorMiddleware);