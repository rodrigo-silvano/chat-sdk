import { pgTable, uuid, varchar, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { agents } from './agents.js';
import { operators } from './operators.js';

export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: uuid('agent_id').notNull().references(() => agents.id),
  sessionId: varchar('session_id', { length: 255 }).notNull(),
  status: varchar('status', { length: 30 }).notNull().default('active_bot'),
  assignedOperatorId: uuid('assigned_operator_id').references(() => operators.id),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ([
  index('conversations_session_id_idx').on(table.sessionId),
  index('conversations_status_idx').on(table.status),
]));
