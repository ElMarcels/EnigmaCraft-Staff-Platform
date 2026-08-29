import { defineConfig } from "prisma/config";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

if (existsSync(".env")) loadEnvFile(".env");

function resolveDbUrl(): string {
  const url = (process.env.DATABASE_URL || "").trim();
  if (!url) {
    throw new Error(
      "DATABASE_URL no está configurada. Añádela en Vercel → Project → Settings → Environment Variables (Production, Preview y Development) con la URL de tu PostgreSQL."
    );
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
