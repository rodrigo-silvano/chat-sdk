import { pgTable, uuid, text, varchar, real, integer, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const agents = pgTable('agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  greetingMessage: text('greeting_message').notNull().default(''),
  systemPrompt: text('system_prompt').notNull().default(''),
  provider: varchar('provider', { length: 20 }).notNull().default('openai'),
  model: varchar('model', { length: 100 }).notNull().default('gpt-4o'),
  temperature: real('temperature').notNull().default(0.7),
  maxTokens: integer('max_tokens').notNull().default(2048),
  config: jsonb('config').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
