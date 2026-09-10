import { pgTable, uuid, varchar, text, jsonb, timestamp, index, boolean } from 'drizzle-orm/pg-core';
import { conversations } from './conversations.js';

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 20 }).notNull(),
  content: text('content').notNull(),
  toolCalls: jsonb('tool_calls'),
  senderType: varchar('sender_type', { length: 10 }).notNull(),
  feedback: varchar('feedback', { length: 20 }),
  isDeleted: boolean('is_deleted').notNull().default(false),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ([
  index('messages_conversation_id_idx').on(table.conversationId),
  index('messages_created_at_idx').on(table.createdAt),
  index('messages_conversation_created_idx').on(table.conversationId, table.createdAt),
  index('messages_feedback_idx').on(table.feedback),
  index('messages_is_deleted_idx').on(table.isDeleted),
]));
