import type { ChatStreamEvent } from '@chat-sdk/shared';

export interface SendMessageParams {
  baseUrl: string;
  agentId: string;
  sessionId: string;
  content: string;
  onEvent: (event: ChatStreamEvent | { type: 'status'; status: string }) => void;
}

export async function sendMessageStream({
  baseUrl,
  agentId,
  sessionId,
  content,
  onEvent,
}: SendMessageParams): Promise<void> {
  const url = `${baseUrl.replace(/\/$/, '')}/api/chat`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      agentId,
      sessionId,
      content,
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error('Failed to send message');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          continue;
        }
        let data = trimmed;
        if (data.startsWith('data: ')) {
          data = data.slice(6);
        }
        try {
          const parsed = JSON.parse(data);
          onEvent(parsed);
        } catch {
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
