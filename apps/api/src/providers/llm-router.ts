import { db } from '../db.js';
import { settings } from '@chat-sdk/database';
import { eq } from 'drizzle-orm';
import { decrypt } from '../utils/crypto.js';
import { OpenAIAdapter } from './openai.adapter.js';
import { AnthropicAdapter } from './anthropic.adapter.js';
import { GoogleAdapter } from './google.adapter.js';
import type { LLMAdapterInterface } from '@chat-sdk/shared';

const adapterCache = new Map<string, LLMAdapterInterface>();

export async function getLLMAdapter(provider: string): Promise<LLMAdapterInterface> {
  const cached = adapterCache.get(provider);
  if (cached) {
    return cached;
  }

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

  let adapter: LLMAdapterInterface;
  if (provider === 'openai') {
    adapter = new OpenAIAdapter(apiKey);
  } else if (provider === 'anthropic') {
    adapter = new AnthropicAdapter(apiKey);
  } else if (provider === 'google') {
    adapter = new GoogleAdapter(apiKey);
  } else {
    throw new Error(`Unsupported provider: ${provider}. Supported: openai, anthropic, google`);
  }

  adapterCache.set(provider, adapter);
  return adapter;
}

export function clearAdapterCache(): void {
  adapterCache.clear();
}

export function getCachedAdapter(provider: string): LLMAdapterInterface | undefined {
  return adapterCache.get(provider);
}
