import { Context, Next } from 'hono';
import { idempotencyRepository } from '../repositories/idempotencyRepository.js';
import { logger } from '../config/logger.js';

export const idempotencyMiddleware = async (c: Context, next: Next) => {
  if (c.req.method !== 'POST' && c.req.method !== 'PATCH') {
    return await next();
  }

  const key = c.req.header('Idempotency-Key');
  if (!key) {
    return await next();
  }

  const user = c.get('user');
  if (!user) {
    return await next();
  }

  const existing = await idempotencyRepository.findByIdAndUser(key, user.id);
  if (existing) {
    return c.json(existing.response as any);
  }

  await next();

  if (c.res.status >= 200 && c.res.status < 300) {
    const resClone = c.res.clone();
    const isJson = resClone.headers.get('content-type')?.includes('application/json');
    if (isJson) {
      const bodyText = await resClone.text();
      try {
        const body = JSON.parse(bodyText);
        await idempotencyRepository.create({
          id: key,
          userId: user.id,
          response: body,
        });
      } catch (e) {
        logger.error('Failed to store idempotency response', e);
      }
    }
  }
};
