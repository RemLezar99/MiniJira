import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { z } from "zod";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFilePath);
const serverRoot = path.resolve(currentDir, "../..");

const envFileName = process.env.NODE_ENV === "test" ? ".env.test" : ".env";

dotenv.config({
  path: path.join(serverRoot, envFileName)
});

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  CLIENT_URL: z.url(),

  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal", "silent"])
    .default("info"),

  LOG_DB_QUERIES: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),

  ENABLE_DEV_LOG_VIEWER: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true")
});

export const env = envSchema.parse(process.env);