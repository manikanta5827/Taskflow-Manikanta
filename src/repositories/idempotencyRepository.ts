import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

export const idempotencyRepository = {
  async create(data: Prisma.IdempotencyKeyUncheckedCreateInput) {
    return prisma.idempotencyKey.create({ data });
  },

  async findById(id: string) {
    return prisma.idempotencyKey.findUnique({
      where: { id },
    });
  },

  async cleanupOldKeys(before: Date) {
    return prisma.idempotencyKey.deleteMany({
      where: { createdAt: { lt: before } },
    });
  },
};
