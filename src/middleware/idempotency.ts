import { Context, Next } from 'hono';
import { idempotencyRepository } from '../repositories/idempotencyRepository';
import { logger } from '../config/logger';

export const idempotencyMiddleware = async (c: Context, next: Next) => {
  const method = c.req.method;
  if (method !== 'POST' && method !== 'PATCH') {
    return await next();
  }

  // Prevent multiple executions for the same request
  if (c.get('idempotency_run')) {
    return await next();
  }
  c.set('idempotency_run', true);

  const key = c.req.header('Idempotency-Key');
  if (!key) {
    return await next();
  }

  const user = c.get('user');
  if (!user) {
    return await next();
  }

  // Construct composite key: key + userId + method + resource (raw path and query)
  const resource = c.req.path + (c.req.url.includes('?') ? '?' + c.req.url.split('?')[1] : '');
  const compositeKey = `${key}:${user.id}:${method}:${resource}`;

  const existing = await idempotencyRepository.findById(compositeKey);
  if (existing) {
    return c.json({ ...(existing.response as object), cache: true });
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
          id: compositeKey,
          userId: user.id,
          response: body,
        });
      } catch (e) {
        logger.error('Failed to store idempotency response', e);
      }
    }
  }
};
