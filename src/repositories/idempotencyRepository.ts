import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';

export const idempotencyRepository = {
  async create(data: Prisma.IdempotencyKeyUncheckedCreateInput) {
    return prisma.idempotencyKey.create({ data });
  },

  async findByIdAndUser(id: string, userId: string) {
    return prisma.idempotencyKey.findFirst({
      where: { id, userId },
    });
  },

  async cleanupOldKeys(before: Date) {
    return prisma.idempotencyKey.deleteMany({
      where: { createdAt: { lt: before } },
    });
  },
};
