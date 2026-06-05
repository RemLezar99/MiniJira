import type { ErrorRequestHandler } from "express";
import { logger } from "../lib/logger.js";

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  logger.error({ error }, "unhandled request error");

  res.status(500).json({
    message: "Internal server error"
  });
};