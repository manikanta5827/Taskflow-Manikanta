import { auditLogRepository } from '../repositories/auditLogRepository.js';
import { logger } from '../config/logger.js';

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
