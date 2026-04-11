import { Context, Next } from 'hono';
import { RateLimitError } from '../utils/errors';

interface RequestLog {
  timestamp: number;
}

class RateLimiter {
  private readonly store = new Map<string, RequestLog[]>();

  constructor(
    private readonly windowMs: number,
    private readonly maxRequests: number
  ) {}

  private cleanup() {
    const now = Date.now();
    for (const [key, logs] of this.store.entries()) {
      const validLogs = logs.filter((log) => now - log.timestamp < this.windowMs);
      if (validLogs.length === 0) {
        this.store.delete(key);
      } else {
        this.store.set(key, validLogs);
      }
    }
  }

  public check(key: string): boolean {
    const now = Date.now();
    // Lazy cleanup of specific key
    let logs = this.store.get(key) || [];
    logs = logs.filter((log) => now - log.timestamp < this.windowMs);

    if (logs.length >= this.maxRequests) {
      return false;
    }

    logs.push({ timestamp: now });
    this.store.set(key, logs);
    return true;
  }
}

const authLimiter = new RateLimiter(60 * 1000, 5); // 5 per min
const taskLimiter = new RateLimiter(60 * 60 * 1000, 100); // 100 per hour
const generalLimiter = new RateLimiter(60 * 60 * 1000, 1000); // 1000 per hour

export const rateLimitAuth = async (c: Context, next: Next) => {
  const ip = c.req.header('x-forwarded-for') || 'unknown';
  if (!authLimiter.check(`auth:${ip}`)) {
    throw new RateLimitError(120);
  }
  await next();
};

export const rateLimitTask = async (c: Context, next: Next) => {
  const user = c.get('user');
  if (user && !taskLimiter.check(`task:${user.id}`)) {
    throw new RateLimitError(3600);
  }
  await next();
};

export const rateLimitGeneral = async (c: Context, next: Next) => {
  const user = c.get('user');
  if (user && !generalLimiter.check(`general:${user.id}`)) {
    throw new RateLimitError(3600);
  }
  await next();
};
