import type { ErrorRequestHandler } from "express";
import { logger } from "../lib/logger.js";
import { HttpError } from "../lib/httpError.js";

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  logger.error({ error }, "request error");

  if (error instanceof HttpError) {
    res.status(error.statusCode).json({
      message: error.message
    });
    return;
  }

  res.status(500).json({
    message: "Internal server error"
  });
};