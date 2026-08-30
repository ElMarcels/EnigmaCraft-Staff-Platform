import { defineConfig } from "prisma/config";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

if (existsSync(".env")) loadEnvFile(".env");

function resolveDbUrl(): string {
  const url = (process.env.DATABASE_URL || "").trim();
  if (!url) {
    return "postgresql://dummy:dummy@localhost:5432/dummy";
  }
  return url;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node --experimental-strip-types prisma/seed.ts",
  },
  datasource: {
    url: resolveDbUrl(),
  },
});
