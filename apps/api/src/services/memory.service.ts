import { db } from '../db.js';
import { memory } from '@chat-sdk/database';
import { eq, and } from 'drizzle-orm';

export class MemoryService {
  async getMemory(sessionId: string): Promise<Record<string, string>> {
    const records = await db.select().from(memory).where(eq(memory.sessionId, sessionId));
    const result: Record<string, string> = {};
    for (const record of records) {
      result[record.key] = record.value;
    }
    return result;
  }

  async setMemory(sessionId: string, key: string, value: string): Promise<void> {
    await db
      .insert(memory)
      .values({
        sessionId,
        key,
        value,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [memory.sessionId, memory.key],
        set: {
          value,
          updatedAt: new Date(),
        },
      });
  }

  async injectMemory(systemPrompt: string, sessionId: string): Promise<string> {
    const memData = await this.getMemory(sessionId);
    const keys = Object.keys(memData);
    if (keys.length === 0) {
      return systemPrompt;
    }

    const memoryContext = keys
      .map((k) => `${k}: ${memData[k]}`)
      .join('\n');

    return `${systemPrompt}\n\nUser Session Memory Context:\n${memoryContext}`;
  }
}
