import { OpenAI } from 'openai';
import type { LLMAdapterInterface, StreamChatParams, ChatStreamEvent } from '@chat-sdk/shared';

export class OpenAIAdapter implements LLMAdapterInterface {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async *streamChat(params: StreamChatParams): AsyncIterable<ChatStreamEvent> {
    try {
      const formattedMessages = params.messages.map((m) => ({
        role: m.role === 'operator' ? 'user' as const : (m.role === 'system' ? 'system' as const : (m.role === 'assistant' ? 'assistant' as const : 'user' as const)),
        content: m.content,
      }));

      const stream = await this.openai.chat.completions.create({
        model: params.model,
        messages: [
          { role: 'system', content: params.systemPrompt },
          ...formattedMessages,
        ],
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens ?? 2048,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) {
          yield { type: 'text_delta', content: delta.content };
        }
        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            if (tc.function?.name) {
              yield {
                type: 'tool_call',
                name: tc.function.name,
                args: tc.function.arguments ? JSON.parse(tc.function.arguments) : {},
              };
            }
          }
        }
        const finishReason = chunk.choices[0]?.finish_reason;
        if (finishReason) {
          let reason: 'stop' | 'tool_use' | 'max_tokens' = 'stop';
          if (finishReason === 'length') {
            reason = 'max_tokens';
          } else if (finishReason === 'tool_calls') {
            reason = 'tool_use';
          }
          yield { type: 'finish', reason };
        }
      }
    } catch (error: any) {
      yield { type: 'error', message: error.message || 'OpenAI stream error' };
    }
  }
}
