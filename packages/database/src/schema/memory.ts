import { pgTable, uuid, varchar, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

export const memory = pgTable('memory', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: varchar('session_id', { length: 255 }).notNull(),
  key: text('key').notNull(),
  value: text('value').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ([
  uniqueIndex('memory_session_id_key_idx').on(table.sessionId, table.key),
]));
