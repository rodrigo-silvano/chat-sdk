import type { ChatMessage } from './message.js';

export type LLMProvider = 'openai' | 'anthropic' | 'google';

export interface LLMModel {
  provider: LLMProvider;
  modelId: string;
  displayName: string;
}

export type ChatStreamEvent =
  | { type: 'text_delta'; content: string }
  | { type: 'tool_call'; name: string; args: Record<string, unknown> }
  | { type: 'finish'; reason: 'stop' | 'tool_use' | 'max_tokens' }
  | { type: 'error'; message: string };

export interface StreamChatParams {
  model: string;
  messages: ChatMessage[];
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMAdapterInterface {
  streamChat(params: StreamChatParams): AsyncIterable<ChatStreamEvent>;
}
