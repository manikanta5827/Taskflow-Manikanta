import { auditLogRepository } from '../repositories/auditLogRepository';
import { logger } from '../config/logger';

export const auditService = {
  logAction(data: {
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    changes?: any;
    ipAddress?: string;
  }) {
    auditLogRepository.create(data).catch((error) => {
      logger.error('Failed to write audit log', { error: String(error) });
    });
  },
};
