import pinoHttpImport from "pino-http";
import type { IncomingMessage, ServerResponse, RequestListener } from "http";
import { logger } from "../lib/logger.js";
import { addDevLog } from "../lib/devLogStore.js";

type PinoHttpFactory = (options: Record<string, unknown>) => RequestListener;

const pinoHttp = pinoHttpImport as unknown as PinoHttpFactory;

export const requestLogger = pinoHttp({
  logger,

  customLogLevel: (_req: IncomingMessage, res: ServerResponse, error: Error | undefined) => {
    if (error || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },

  customSuccessMessage: (req: IncomingMessage, res: ServerResponse) => {
    return `${req.method} ${req.url} completed with ${res.statusCode}`;
  },

  customErrorMessage: (req: IncomingMessage, res: ServerResponse) => {
    return `${req.method} ${req.url} failed with ${res.statusCode}`;
  },

  customSuccessObject: (
    req: IncomingMessage,
    res: ServerResponse,
    object: Record<string, unknown>
  ) => {
    const message = `${req.method} ${req.url} completed with ${res.statusCode}`;

    addDevLog({
      level: res.statusCode >= 400 ? "warn" : "info",
      source: "http",
      message,
      data: {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        responseTime: object.responseTime
      }
    });

    return object;
  },

  customErrorObject: (
    req: IncomingMessage,
    res: ServerResponse,
    error: Error,
    object: Record<string, unknown>
  ) => {
    const message = `${req.method} ${req.url} failed with ${res.statusCode}`;

    addDevLog({
      level: "error",
      source: "http",
      message,
      data: {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        error: error.message
      }
    });

    return object;
  }
});