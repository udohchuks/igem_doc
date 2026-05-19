import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL is not set. Database calls will fail.");
}

// Connection pool — reused across requests in the same process.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Supabase free tier limits connections; keep pool small.
  max: 5,
  idleTimeoutMillis: 30_000,
});

export const db = drizzle(pool, { schema });
export type DB = typeof db;
