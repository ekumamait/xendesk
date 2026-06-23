import "dotenv/config";
import { defineConfig } from "prisma/config";

// The Prisma CLI (migrate/db) connects directly to Postgres. With Neon we use
// the non-pooled DIRECT_URL here so migrations bypass the connection pooler,
// while the runtime client uses the pooled DATABASE_URL via a driver adapter.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url:
      process.env.DIRECT_URL ??
      process.env.DATABASE_URL ??
      process.env.POSTGRES_URL_NON_POOLING ??
      process.env.POSTGRES_PRISMA_URL ??
      process.env.POSTGRES_URL,
  },
});
