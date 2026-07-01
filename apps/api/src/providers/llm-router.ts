import { db } from '../db.js';
import { settings } from '@chat-sdk/database';
import { eq } from 'drizzle-orm';
import { decrypt } from '../utils/crypto.js';
import { OpenAIAdapter } from './openai.adapter.js';
import { AnthropicAdapter } from './anthropic.adapter.js';
import { GoogleAdapter } from './google.adapter.js';
import type { LLMAdapterInterface } from '@chat-sdk/shared';

export async function getLLMAdapter(provider: string): Promise<LLMAdapterInterface> {
  const keyName = `${provider}_api_key`;
  const setting = await db.select().from(settings).where(eq(settings.key, keyName)).limit(1);
  let apiKey = setting[0]?.value ? decrypt(setting[0].value) : undefined;

  if (!apiKey) {
    const envKey = `${provider.toUpperCase()}_API_KEY`;
    apiKey = process.env[envKey];
  }

  if (!apiKey) {
    throw new Error(`API key for provider ${provider} not found`);
  }

  if (provider === 'openai') {
    return new OpenAIAdapter(apiKey);
  }
  if (provider === 'anthropic') {
    return new AnthropicAdapter(apiKey);
  }
  if (provider === 'google') {
    return new GoogleAdapter(apiKey);
  }

  throw new Error(`Unsupported provider: ${provider}`);
}
