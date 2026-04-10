import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';

export const userRepository = {
  async create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data });
  },

  async findByEmail(email: string) {
    return prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
  },

  async findActiveById(id: string) {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
  },
};
