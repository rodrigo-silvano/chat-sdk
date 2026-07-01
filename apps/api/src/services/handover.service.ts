import { db } from '../db.js';
import { conversations, operators } from '@chat-sdk/database';
import { eq } from 'drizzle-orm';
import type { ConversationStatus } from '@chat-sdk/shared';
import { MailService } from './mail.service.js';

const mailService = new MailService();

export class HandoverService {
  async requestHandover(conversationId: string): Promise<void> {
    await db
      .update(conversations)
      .set({
        status: 'handover_requested',
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversationId));

    try {
      const ops = await db.select({ email: operators.email }).from(operators);
      for (const op of ops) {
        if (op.email) {
          await mailService.sendEmail(
            op.email,
            'Solicitação de Atendimento Humano',
            `<h1>Atendimento Humano Solicitado</h1><p>Uma nova conversa (ID: ${conversationId}) solicitou a transição para um operador humano. Por favor, aceda ao painel de administração para responder.</p>`
          );
        }
      }
    } catch {
    }
  }

  async assignOperator(conversationId: string, operatorId: string): Promise<void> {
    await db
      .update(conversations)
      .set({
        status: 'active_human',
        assignedOperatorId: operatorId,
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversationId));
  }

  async unassignOperator(conversationId: string): Promise<void> {
    await db
      .update(conversations)
      .set({
        status: 'waiting_for_agent',
        assignedOperatorId: null,
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversationId));
  }

  async resolveConversation(conversationId: string): Promise<void> {
    await db
      .update(conversations)
      .set({
        status: 'resolved',
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversationId));
  }

  async updateStatus(conversationId: string, status: ConversationStatus): Promise<void> {
    await db
      .update(conversations)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversationId));
  }
}
