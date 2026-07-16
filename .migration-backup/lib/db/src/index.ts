import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                    // max simultaneous connections
  idleTimeoutMillis: 30_000,  // release idle connections after 30s
  connectionTimeoutMillis: 5_000, // fail fast if no connection available
  allowExitOnIdle: false,
});

pool.on("error", (err) => {
  console.error("Unexpected pg pool error", err);
});

export const db = drizzle(pool, { schema });

export * from "./schema";
