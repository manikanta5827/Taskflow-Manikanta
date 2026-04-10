import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';

export const auditLogRepository = {
  async create(data: Prisma.AuditLogUncheckedCreateInput) {
    return prisma.auditLog.create({ data });
  },

  async findLogs(filters: { entityType?: string; entityId?: string }) {
    const where: Prisma.AuditLogWhereInput = {};
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.entityId) where.entityId = filters.entityId;

    return prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
  },
};
