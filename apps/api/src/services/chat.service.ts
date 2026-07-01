import { db } from '../db.js';
import { conversations, messages } from '@chat-sdk/database';
import { eq, and, ne, asc } from 'drizzle-orm';
import type { ChatMessage, Conversation, MessageRole, SenderType } from '@chat-sdk/shared';

export class ChatService {
  async getOrCreateConversation(agentId: string, sessionId: string): Promise<Conversation> {
    const existing = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.sessionId, sessionId),
          eq(conversations.agentId, agentId),
          ne(conversations.status, 'resolved')
        )
      )
      .limit(1);

    if (existing[0]) {
      return existing[0] as Conversation;
    }

    const [newConversation] = await db
      .insert(conversations)
      .values({
        agentId,
        sessionId,
        status: 'active_bot',
        metadata: {},
      })
      .returning();

    if (!newConversation) {
      throw new Error('Failed to create conversation');
    }

    return newConversation as Conversation;
  }

  async getConversation(id: string): Promise<Conversation | null> {
    const records = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
    return (records[0] as Conversation) || null;
  }

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    const records = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));

    return records.map((r) => ({
      id: r.id,
      conversationId: r.conversationId,
      role: r.role as MessageRole,
      content: r.content,
      senderType: r.senderType as SenderType,
      createdAt: r.createdAt,
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
      createdAt: record.createdAt,
    };
  }
}
