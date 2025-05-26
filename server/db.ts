import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL must be set. Did you forget to provision a database?',
  );
}

// ✅ Use SSL for Render PostgreSQL
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ...(process.env.NODE_ENV === 'production' ? {
    ssl: {
      rejectUnauthorized: false,
    }
  } : {}),
});

export const db = drizzle(pool, { schema });
