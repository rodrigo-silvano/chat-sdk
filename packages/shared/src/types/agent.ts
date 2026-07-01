import { z } from 'zod';
import type { LLMProvider } from './provider.js';

export interface AgentConfig {
  id: string;
  name: string;
  greetingMessage: string;
  systemPrompt: string;
  provider: LLMProvider;
  model: string;
  temperature: number;
  maxTokens: number;
  config: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export const CreateAgentInputSchema = z.object({
  name: z.string().min(1),
  greetingMessage: z.string(),
  systemPrompt: z.string(),
  provider: z.enum(['openai', 'anthropic', 'google']),
  model: z.string().min(1),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().positive().default(2048),
});

export type CreateAgentInput = z.infer<typeof CreateAgentInputSchema>;
