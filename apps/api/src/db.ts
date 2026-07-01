import { createDatabase } from '@chat-sdk/database';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

export const db = createDatabase(process.env.DATABASE_URL);
