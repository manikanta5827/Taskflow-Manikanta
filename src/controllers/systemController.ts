import { Context } from 'hono';
import { systemService } from '../services/systemService';
import { auditLogRepository } from '../repositories/auditLogRepository';

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
    const { entityType, entityId } = c.req.query();
    const logs = await auditLogRepository.findLogs({ entityType, entityId });
    return c.json(logs);
  },
};
