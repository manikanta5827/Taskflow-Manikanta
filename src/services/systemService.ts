import { prisma } from '../config/prisma';

export const systemService = {
  async healthCheck() {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: 'healthy', database: 'connected' };
    } catch (err) {
      console.error('Database connection failed:', err);
      return { status: 'unhealthy', database: 'disconnected' };
    }
  },
};
