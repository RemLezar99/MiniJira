import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

const currentFilePath = fileURLToPath(import.meta.url);
const serverRoot = path.dirname(currentFilePath);

const envFileName = process.env.NODE_ENV === "test" ? ".env.test" : ".env";

dotenv.config({
  path: path.join(serverRoot, envFileName),
  override: true
});

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations"
  },
  datasource: {
    url: env("DATABASE_URL")
  }
});

