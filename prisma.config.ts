import { defineConfig, env } from "prisma/config";
import { loadEnvFile } from "node:process";

loadEnvFile(".env");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node --experimental-strip-types --env-file=.env prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
