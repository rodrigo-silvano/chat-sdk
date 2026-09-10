import { z } from 'zod';

export type MessageRole = 'user' | 'assistant' | 'system' | 'operator';

export type SenderType = 'user' | 'bot' | 'human';

export type MessageFeedback = 'positive' | 'negative' | 'neutral' | null;

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  senderType: SenderType;
  feedback: MessageFeedback;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const CreateMessageInputSchema = z.object({
  conversationId: z.string(),
  role: z.enum(['user', 'assistant', 'system', 'operator']),
  content: z.string(),
  senderType: z.enum(['user', 'bot', 'human']),
});

export type CreateMessageInput = z.infer<typeof CreateMessageInputSchema>;

export const UpdateMessageFeedbackSchema = z.object({
  messageId: z.string(),
  feedback: z.enum(['positive', 'negative', 'neutral']).nullable(),
});

export type UpdateMessageFeedbackInput = z.infer<typeof UpdateMessageFeedbackSchema>;
