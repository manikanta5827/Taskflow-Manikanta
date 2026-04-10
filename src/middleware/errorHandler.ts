import { Context } from 'hono';
import { AppError } from '../utils/errors.js';
import { logger } from '../config/logger.js';
import { ZodError } from 'zod';

export const errorHandler = (err: Error, c: Context) => {
  logger.error(err.message, { stack: err.stack, path: c.req.path });

  if (err instanceof AppError) {
    const response: any = { error: err.message };
    if (err.fields) response.fields = err.fields;
    if ((err as any).retryAfter) {
      c.header('Retry-After', String((err as any).retryAfter));
      response.retryAfter = (err as any).retryAfter;
    }
    return c.json(response, err.statusCode as any);
  }

  if (err instanceof ZodError) {
    const fields: Record<string, string> = {};
    err.errors.forEach((e) => {
      if (e.path.length > 0) {
        fields[e.path[0]] = e.message;
      }
    });
    return c.json({ error: 'validation failed', fields }, 400);
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as any;
    if (prismaErr.code === 'P2002') {
      const target = prismaErr.meta?.target || 'field';
      return c.json(
        { error: 'conflict', message: `Unique constraint violation on ${target}` },
        409
      );
    }
    if (prismaErr.code === 'P2025') {
      return c.json({ error: 'not found', message: 'Resource not found' }, 404);
    }
  }

  if (err instanceof SyntaxError && err.message.includes('JSON')) {
    return c.json({ error: 'bad request', message: 'Invalid JSON payload' }, 400);
  }

  return c.json({ error: 'internal server error' }, 500);
};
