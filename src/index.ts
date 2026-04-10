import { Hono } from 'hono';
import { logger } from './config/logger';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { routes } from './routes/index';

const app = new Hono();

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

export { app };

export default {
  port: env.PORT,
  fetch: app.fetch,
};
