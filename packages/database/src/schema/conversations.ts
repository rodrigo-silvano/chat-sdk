import { pgTable, uuid, varchar, jsonb, timestamp, index, boolean, text, pgEnum } from 'drizzle-orm/pg-core';
import { agents } from './agents.js';
import { operators } from './operators.js';

export const conversationTags = pgEnum('conversation_tags', ['support', 'sales', 'technical', 'general', 'urgent', 'feedback', 'bug', 'feature_request']);

export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: uuid('agent_id').notNull().references(() => agents.id),
  sessionId: varchar('session_id', { length: 255 }).notNull(),
  status: varchar('status', { length: 30 }).notNull().default('active_bot'),
  assignedOperatorId: uuid('assigned_operator_id').references(() => operators.id),
  metadata: jsonb('metadata').notNull().default({}),
  tags: text('tags').array().default([]),
  priority: varchar('priority', { length: 10 }).default('medium'),
  isDeleted: boolean('is_deleted').notNull().default(false),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ([
  index('conversations_session_id_idx').on(table.sessionId),
  index('conversations_status_idx').on(table.status),
  index('conversations_agent_id_idx').on(table.agentId),
  index('conversations_assigned_operator_id_idx').on(table.assignedOperatorId),
  index('conversations_created_at_idx').on(table.createdAt),
  index('conversations_priority_idx').on(table.priority),
  index('conversations_is_deleted_idx').on(table.isDeleted),
  index('conversations_tags_idx').using('gin', table.tags),
]));
