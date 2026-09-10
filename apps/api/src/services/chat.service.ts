import { db } from '../db.js';
import { conversations, messages } from '@chat-sdk/database';
import { eq, and, ne, asc } from 'drizzle-orm';
import type { ChatMessage, Conversation, MessageRole, SenderType, MessageFeedback, ConversationPriority, ConversationTag } from '@chat-sdk/shared';

export class ChatService {
  async getOrCreateConversation(agentId: string, sessionId: string): Promise<Conversation> {
    const existing = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.sessionId, sessionId),
          eq(conversations.agentId, agentId),
          ne(conversations.status, 'resolved'),
          eq(conversations.isDeleted, false)
        )
      )
      .limit(1);

    if (existing[0]) {
      return {
        id: existing[0].id,
        agentId: existing[0].agentId,
        sessionId: existing[0].sessionId,
        status: existing[0].status as any,
        assignedOperatorId: existing[0].assignedOperatorId,
        metadata: existing[0].metadata as Record<string, unknown>,
        tags: existing[0].tags as ConversationTag[],
        priority: existing[0].priority as ConversationPriority,
        isDeleted: existing[0].isDeleted,
        deletedAt: existing[0].deletedAt,
        createdAt: existing[0].createdAt,
        updatedAt: existing[0].updatedAt,
      };
    }

    const [newConversation] = await db
      .insert(conversations)
      .values({
        agentId,
        sessionId,
        status: 'active_bot',
        metadata: {},
        tags: [],
        priority: 'medium',
        isDeleted: false,
      })
      .returning();

    if (!newConversation) {
      throw new Error('Failed to create conversation');
    }

    return {
      id: newConversation.id,
      agentId: newConversation.agentId,
      sessionId: newConversation.sessionId,
      status: newConversation.status as any,
      assignedOperatorId: newConversation.assignedOperatorId,
      metadata: newConversation.metadata as Record<string, unknown>,
      tags: newConversation.tags as ConversationTag[],
      priority: newConversation.priority as ConversationPriority,
      isDeleted: newConversation.isDeleted,
      deletedAt: newConversation.deletedAt,
      createdAt: newConversation.createdAt,
      updatedAt: newConversation.updatedAt,
    };
  }

  async getConversation(id: string, includeDeleted: boolean = false): Promise<Conversation | null> {
    let query = db.select().from(conversations).$dynamic()
      .where(eq(conversations.id, id)).limit(1);
    
    if (!includeDeleted) {
      query = query.where(eq(conversations.isDeleted, false));
    }

    const records = await query;
    if (!records[0]) {
      return null;
    }

    return {
      id: records[0].id,
      agentId: records[0].agentId,
      sessionId: records[0].sessionId,
      status: records[0].status as any,
      assignedOperatorId: records[0].assignedOperatorId,
      metadata: records[0].metadata as Record<string, unknown>,
      tags: records[0].tags as ConversationTag[],
      priority: records[0].priority as ConversationPriority,
      isDeleted: records[0].isDeleted,
      deletedAt: records[0].deletedAt,
      createdAt: records[0].createdAt,
      updatedAt: records[0].updatedAt,
    };
  }

  async getMessages(conversationId: string, includeDeleted: boolean = false): Promise<ChatMessage[]> {
    let query = db
      .select()
      .from(messages).$dynamic()
      .where(eq(messages.conversationId, conversationId));

    if (!includeDeleted) {
      query = query.where(eq(messages.isDeleted, false));
    }

    const records = await query.orderBy(asc(messages.createdAt));

    return records.map((r) => ({
      id: r.id,
      conversationId: r.conversationId,
      role: r.role as MessageRole,
      content: r.content,
      senderType: r.senderType as SenderType,
      feedback: r.feedback as MessageFeedback,
      isDeleted: r.isDeleted,
      deletedAt: r.deletedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  async createMessage(input: {
    conversationId: string;
    role: MessageRole;
    content: string;
    senderType: SenderType;
  }): Promise<ChatMessage> {
    const [record] = await db
      .insert(messages)
      .values({
        conversationId: input.conversationId,
        role: input.role,
        content: input.content,
        senderType: input.senderType,
        feedback: null,
        isDeleted: false,
        deletedAt: null,
        updatedAt: new Date(),
      })
      .returning();

    if (!record) {
      throw new Error('Failed to insert message');
    }

    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, input.conversationId));

    return {
      id: record.id,
      conversationId: record.conversationId,
      role: record.role as MessageRole,
      content: record.content,
      senderType: record.senderType as SenderType,
      feedback: null,
      isDeleted: false,
      deletedAt: null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async updateMessageFeedback(messageId: string, feedback: MessageFeedback): Promise<ChatMessage> {
    const [record] = await db
      .update(messages)
      .set({
        feedback,
        updatedAt: new Date(),
      })
      .where(eq(messages.id, messageId))
      .returning();

    if (!record) {
      throw new Error('Message not found');
    }

    return {
      id: record.id,
      conversationId: record.conversationId,
      role: record.role as MessageRole,
      content: record.content,
      senderType: record.senderType as SenderType,
      feedback: record.feedback as MessageFeedback,
      isDeleted: record.isDeleted,
      deletedAt: record.deletedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async softDeleteMessage(messageId: string): Promise<ChatMessage> {
    const [record] = await db
      .update(messages)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(messages.id, messageId))
      .returning();

    if (!record) {
      throw new Error('Message not found');
    }

    return {
      id: record.id,
      conversationId: record.conversationId,
      role: record.role as MessageRole,
      content: record.content,
      senderType: record.senderType as SenderType,
      feedback: record.feedback as MessageFeedback,
      isDeleted: true,
      deletedAt: record.deletedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async restoreMessage(messageId: string): Promise<ChatMessage> {
    const [record] = await db
      .update(messages)
      .set({
        isDeleted: false,
        deletedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(messages.id, messageId))
      .returning();

    if (!record) {
      throw new Error('Message not found');
    }

    return {
      id: record.id,
      conversationId: record.conversationId,
      role: record.role as MessageRole,
      content: record.content,
      senderType: record.senderType as SenderType,
      feedback: record.feedback as MessageFeedback,
      isDeleted: false,
      deletedAt: null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async updateConversationTags(conversationId: string, tags: ConversationTag[]): Promise<Conversation> {
    const [record] = await db
      .update(conversations)
      .set({
        tags,
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversationId))
      .returning();

    if (!record) {
      throw new Error('Conversation not found');
    }

    return {
      id: record.id,
      agentId: record.agentId,
      sessionId: record.sessionId,
      status: record.status as any,
      assignedOperatorId: record.assignedOperatorId,
      metadata: record.metadata as Record<string, unknown>,
      tags: record.tags as ConversationTag[],
      priority: record.priority as ConversationPriority,
      isDeleted: record.isDeleted,
      deletedAt: record.deletedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async updateConversationPriority(conversationId: string, priority: ConversationPriority): Promise<Conversation> {
    const [record] = await db
      .update(conversations)
      .set({
        priority,
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversationId))
      .returning();

    if (!record) {
      throw new Error('Conversation not found');
    }

    return {
      id: record.id,
      agentId: record.agentId,
      sessionId: record.sessionId,
      status: record.status as any,
      assignedOperatorId: record.assignedOperatorId,
      metadata: record.metadata as Record<string, unknown>,
      tags: record.tags as ConversationTag[],
      priority: record.priority as ConversationPriority,
      isDeleted: record.isDeleted,
      deletedAt: record.deletedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async softDeleteConversation(conversationId: string): Promise<Conversation> {
    const [record] = await db
      .update(conversations)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversationId))
      .returning();

    if (!record) {
      throw new Error('Conversation not found');
    }

    return {
      id: record.id,
      agentId: record.agentId,
      sessionId: record.sessionId,
      status: record.status as any,
      assignedOperatorId: record.assignedOperatorId,
      metadata: record.metadata as Record<string, unknown>,
      tags: record.tags as ConversationTag[],
      priority: record.priority as ConversationPriority,
      isDeleted: true,
      deletedAt: record.deletedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
