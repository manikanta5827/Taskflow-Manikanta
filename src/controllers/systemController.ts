import { Context } from 'hono';
import { systemService } from '../services/systemService';
import { auditLogRepository } from '../repositories/auditLogRepository';
import { logger } from '../config/logger';
import { z } from 'zod';

const queryAuditLogsSchema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().uuid(),
});

export const systemController = {
  async health(c: Context) {
    const result = await systemService.healthCheck();
    const body = {
      status: result.status,
      timestamp: new Date().toISOString(),
      database: result.database,
    };
    return c.json(body, result.status === 'healthy' ? 200 : 503);
  },

  async getAuditLogs(c: Context) {
    const { entityType, entityId } = queryAuditLogsSchema.parse(c.req.query());
    logger.info(`Audit logs requested ${entityType} ${entityId}`);

    const logs = await auditLogRepository.findLogs({ entityType, entityId });
    return c.json(logs);
  },
};
