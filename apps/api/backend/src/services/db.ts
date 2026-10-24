// db.ts
import { Pool } from 'pg';

const db = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432, // default postgresql port
  user: process.env.DB_USER || "value not set in .env",
  password: process.env.DB_PASSWORD || "value not set in .env",
  database: process.env.DB_NAME || 'axiom',
});

export default db;
