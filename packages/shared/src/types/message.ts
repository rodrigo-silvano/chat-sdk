import { z } from 'zod';

export type MessageRole = 'user' | 'assistant' | 'system' | 'operator';

export type SenderType = 'user' | 'bot' | 'human';

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  senderType: SenderType;
  createdAt: Date;
}

export const CreateMessageInputSchema = z.object({
  conversationId: z.string(),
  role: z.enum(['user', 'assistant', 'system', 'operator']),
  content: z.string(),
  senderType: z.enum(['user', 'bot', 'human']),
});

export type CreateMessageInput = z.infer<typeof CreateMessageInputSchema>;
