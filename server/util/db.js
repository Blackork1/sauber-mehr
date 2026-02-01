import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

function buildConfig() {
  // Prefer DATABASE_URL if provided
  if (process.env.DATABASE_URL) {
    const sslEnabled = process.env.DB_SSL === "true";
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: sslEnabled ? { rejectUnauthorized: false } : false,
    };
  }

  return {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: false,
  };
}

export const pool = new Pool({
  ...buildConfig(),
  max: Number(process.env.DB_POOL_MAX || 10),
  idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS || 30000),
  connectionTimeoutMillis: Number(process.env.DB_CONN_TIMEOUT_MS || 10000),
  application_name: process.env.DB_APP_NAME || "sauber-mehr",
});

pool.on("connect", () => console.log("✅ Mit Datenbank verbunden"));
pool.on("error", (err) => console.error("❌ DB Pool Error:", err));

process.on("SIGTERM", async () => {
  try { await pool.end(); } finally { process.exit(0); }
});
process.on("SIGINT", async () => {
  try { await pool.end(); } finally { process.exit(0); }
});

export default pool;
