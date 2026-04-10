import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

export const projectRepository = {
  async create(data: Prisma.ProjectUncheckedCreateInput) {
    return prisma.project.create({ data });
  },

  async findActiveById(id: string) {
    return prisma.project.findFirst({
      where: { id, deletedAt: null },
      include: { tasks: { where: { deletedAt: null } } },
    });
  },

  async findById(id: string) {
    return prisma.project.findUnique({
      where: { id },
    });
  },

  async findActiveForUser(userId: string) {
    return prisma.project.findMany({
      where: {
        deletedAt: null,
        OR: [{ ownerId: userId }, { tasks: { some: { assigneeId: userId, deletedAt: null } } }],
      },
    });
  },

  async update(id: string, data: Prisma.ProjectUpdateInput) {
    return prisma.project.update({
      where: { id },
      data,
    });
  },

  async softDelete(id: string) {
    return prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },

  async restore(id: string) {
    return prisma.project.update({
      where: { id },
      data: { deletedAt: null },
    });
  },
};
