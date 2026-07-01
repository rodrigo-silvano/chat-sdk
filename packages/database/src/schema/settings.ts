import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';

export const settings = pgTable('settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 255 }).notNull().unique(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
