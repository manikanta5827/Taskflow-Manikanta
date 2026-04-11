import { Hono } from 'hono';
import { logger as honoLogger } from 'hono/logger';
import { logger } from './config/logger';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { routes } from './routes/index';
import { connInfoMiddleware } from './middleware/connInfo';
import { prisma } from './config/prisma';

const app = new Hono();

// Global Middlewares
app.use('*', connInfoMiddleware);
app.use('*', honoLogger());

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

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  try {
    await prisma.$disconnect();
    logger.info('Prisma disconnected.');
    process.exit(0);
  } catch (err) {
    logger.error('Error during graceful shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
