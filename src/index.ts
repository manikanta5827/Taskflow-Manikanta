import { Hono } from 'hono';
import { logger as honoLogger } from 'hono/logger';
import { logger } from './config/logger';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { routes } from './routes/index';
import { connInfoMiddleware } from './middleware/connInfo';

const app = new Hono();

// Global Middlewares
app.use('*', connInfoMiddleware);
app.use('*', honoLogger());

// Still use our winston logger for structured file logging
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  logger.info('HTTP Request', {
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    duration,
  });
});

app.onError(errorHandler);

app.route('/', routes);

app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: 'Not Found',
      message: `The requested path ${c.req.path} with method ${c.req.method} does not exist.`,
    },
    404
  );
});

export { app };

export default {
  port: env.PORT,
  fetch: app.fetch,
};
