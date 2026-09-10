import fs from 'fs';
import path from 'path';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  ENCRYPTION_KEY: z.string().min(32, 'ENCRYPTION_KEY must be at least 32 characters'),
  PORT: z.string().regex(/^\d+$/, 'PORT must be a number').default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ALLOWED_ORIGINS: z.string().optional(),
});

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '../../.env');
  const envPathLocal = path.resolve(process.cwd(), '.env');
  
  let content = '';
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf-8');
  } else if (fs.existsSync(envPathLocal)) {
    content = fs.readFileSync(envPathLocal, 'utf-8');
  }

  if (content) {
    for (const line of content.split('\n')) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] || '';
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1);
        } else if (val.startsWith("'") && val.endsWith("'")) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    }
  }

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('\n');
    throw new Error(`Environment validation failed:\n${errors}`);
  }

  const parsed = result.data;
  process.env.DATABASE_URL = parsed.DATABASE_URL;
  process.env.REDIS_URL = parsed.REDIS_URL;
  process.env.JWT_SECRET = parsed.JWT_SECRET;
  process.env.JWT_REFRESH_SECRET = parsed.JWT_REFRESH_SECRET;
  process.env.ENCRYPTION_KEY = parsed.ENCRYPTION_KEY;
  process.env.PORT = parsed.PORT;
  process.env.NODE_ENV = parsed.NODE_ENV;
  if (parsed.ALLOWED_ORIGINS) {
    process.env.ALLOWED_ORIGINS = parsed.ALLOWED_ORIGINS;
  }
}

loadEnv();
