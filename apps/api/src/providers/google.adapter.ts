import { GoogleGenerativeAI } from '@google/generative-ai';
import type { LLMAdapterInterface, StreamChatParams, ChatStreamEvent } from '@chat-sdk/shared';

export class GoogleAdapter implements LLMAdapterInterface {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async *streamChat(params: StreamChatParams): AsyncIterable<ChatStreamEvent> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: params.model,
        systemInstruction: params.systemPrompt,
        generationConfig: {
          temperature: params.temperature ?? 0.7,
          maxOutputTokens: params.maxTokens ?? 2048,
        },
      });

      const contents = params.messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const result = await model.generateContentStream({ contents });

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          yield { type: 'text_delta', content: text };
        }
      }
      yield { type: 'finish', reason: 'stop' };
    } catch (error: any) {
      yield { type: 'error', message: error.message || 'Google stream error' };
    }
  }
}
