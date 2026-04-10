import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

export const taskRepository = {
  async create(data: Prisma.TaskUncheckedCreateInput) {
    return prisma.task.create({ data });
  },

  async findActiveById(id: string) {
    return prisma.task.findFirst({
      where: { id, deletedAt: null },
      include: { project: true },
    });
  },

  async findById(id: string) {
    return prisma.task.findUnique({
      where: { id },
      include: { project: true },
    });
  },

  async findActiveByProject(
    projectId: string,
    filters: { status?: any; assigneeId?: string; search?: string }
  ) {
    const where: Prisma.TaskWhereInput = {
      projectId,
      deletedAt: null,
    };

    if (filters.status) where.status = filters.status;
    if (filters.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters.search) {
      where.title = { contains: filters.search, mode: 'insensitive' };
    }

    return prisma.task.findMany({ where });
  },

  async update(id: string, data: Prisma.TaskUpdateInput) {
    return prisma.task.update({
      where: { id },
      data,
      include: { project: true },
    });
  },

  async softDelete(id: string) {
    return prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: { project: true },
    });
  },

  async restore(id: string) {
    return prisma.task.update({
      where: { id },
      data: { deletedAt: null },
      include: { project: true },
    });
  },
};
