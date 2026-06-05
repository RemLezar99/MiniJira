import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { env } from "./env.js";
import { logger } from "./logger.js";

const pool = new Pool({
  connectionString: env.DATABASE_URL
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  log: env.LOG_DB_QUERIES
    ? [
        { emit: "event", level: "query" },
        { emit: "event", level: "error" },
        { emit: "event", level: "warn" }
      ]
    : [
        { emit: "event", level: "error" },
        { emit: "event", level: "warn" }
      ]
});

prisma.$on("query", (event) => {
  logger.debug(
    {
      query: event.query,
      params: event.params,
      durationMs: event.duration
    },
    "database query"
  );
});

prisma.$on("error", (event) => {
  logger.error(
    {
      message: event.message,
      target: event.target
    },
    "database error"
  );
});

prisma.$on("warn", (event) => {
  logger.warn(
    {
      message: event.message,
      target: event.target
    },
    "database warning"
  );
});