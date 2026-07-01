import { Anthropic } from '@anthropic-ai/sdk';
import type { LLMAdapterInterface, StreamChatParams, ChatStreamEvent } from '@chat-sdk/shared';

export class AnthropicAdapter implements LLMAdapterInterface {
  private anthropic: Anthropic;

  constructor(apiKey: string) {
    this.anthropic = new Anthropic({ apiKey });
  }

  async *streamChat(params: StreamChatParams): AsyncIterable<ChatStreamEvent> {
    try {
      const formattedMessages = params.messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role === 'assistant' ? 'assistant' as const : 'user' as const,
          content: m.content,
        }));

      const stream = await this.anthropic.messages.create({
        model: params.model,
        messages: formattedMessages,
        system: params.systemPrompt,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens ?? 2048,
        stream: true,
      });

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          yield { type: 'text_delta', content: chunk.delta.text };
        }
        if (chunk.type === 'message_delta' && chunk.delta.stop_reason) {
          let reason: 'stop' | 'tool_use' | 'max_tokens' = 'stop';
          if (chunk.delta.stop_reason === 'max_tokens') {
            reason = 'max_tokens';
          } else if (chunk.delta.stop_reason === 'tool_use') {
            reason = 'tool_use';
          }
          yield { type: 'finish', reason };
        }
      }
    } catch (error: any) {
      yield { type: 'error', message: error.message || 'Anthropic stream error' };
    }
  }
}
