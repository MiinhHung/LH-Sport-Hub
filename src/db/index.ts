import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "Thiếu DATABASE_URL. Sao chép .env.example thành .env.local và điền connection string của Supabase.",
  );
}

/**
 * Next.js dev mode hot-reload sẽ tạo lại module nhiều lần, nên cache
 * client trên globalThis để không mở hàng loạt connection thừa.
 */
const globalForDb = globalThis as unknown as {
  __lhSportHubPg?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.__lhSportHubPg ??
  postgres(connectionString, {
    // Supabase transaction pooler không hỗ trợ prepared statements.
    prepare: false,
    max: process.env.NODE_ENV === "production" ? 10 : 3,
    idle_timeout: 20,
    connect_timeout: 15,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__lhSportHubPg = client;
}

export const db = drizzle(client, { schema, casing: "snake_case" });

export type Db = typeof db;
export type DbTransaction = Parameters<Parameters<Db["transaction"]>[0]>[0];

export { schema };
