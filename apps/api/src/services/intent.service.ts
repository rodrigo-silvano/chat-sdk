import { getLLMAdapter } from '../providers/llm-router.js';
import type { ChatMessage } from '@chat-sdk/shared';

export class IntentService {
  async detectIntent(
    provider: string,
    model: string,
    latestMessage: string,
    history: ChatMessage[] = []
  ): Promise<'human_handover' | 'frustration' | 'general'> {
    try {
      const adapter = await getLLMAdapter(provider);
      const systemPrompt = `You are a helper that classifies user intent.
Classify the user's latest message into one of these labels:
- human_handover: User explicitly asks to talk to a human, operator, support agent, or wants human assistance.
- frustration: User is highly frustrated, angry, or complaining strongly.
- general: General questions, greetings, or other normal queries.

Respond with exactly one word from this list: human_handover, frustration, general. Do not include any other text or formatting.`;

      const params = {
        model,
        systemPrompt,
        messages: [
          ...history.slice(-5),
          {
            id: 'temp-intent',
            conversationId: 'temp',
            role: 'user' as const,
            content: latestMessage,
            senderType: 'user' as const,
            createdAt: new Date(),
          },
        ],
        temperature: 0,
        maxTokens: 10,
      };

      const stream = adapter.streamChat(params);
      let classification = '';
      for await (const chunk of stream) {
        if (chunk.type === 'text_delta') {
          classification += chunk.content;
        }
      }

      const cleanLabel = classification.trim().toLowerCase();
      if (cleanLabel.includes('human_handover')) {
        return 'human_handover';
      }
      if (cleanLabel.includes('frustration')) {
        return 'frustration';
      }
      return 'general';
    } catch {
      return 'general';
    }
  }
}
