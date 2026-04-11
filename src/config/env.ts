import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRY: z.string().default('24h'),
  PORT: z
    .string()
    .transform((p) => parseInt(p, 10))
    .default('8080'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.string().default('info'),
  LOG_FILE: z.string().default('logs/app.log'),
});

// Since node environment handles env differently we fallback safely if it's missing entirely (won't happen in docker)
export const env = envSchema.parse(process.env);
