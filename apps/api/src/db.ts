import './env.js';
import { createDatabase } from '@chat-sdk/database';

export const db = createDatabase(process.env.DATABASE_URL!);
