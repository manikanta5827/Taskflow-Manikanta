import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

export const taskRepository = {
  async create(data: Prisma.TaskUncheckedCreateInput) {
    return prisma.task.create({ data });
  },

  async findById(id: string) {
    return prisma.task.findUnique({
      where: { id },
      include: { project: true },
    });
  },

  async findByProject(
    projectId: string,
    filters: { status?: any; assigneeId?: string; search?: string },
    skip: number = 0,
    take: number = 10
  ) {
    const where: Prisma.TaskWhereInput = {
      projectId,
    };

    if (filters.status) where.status = filters.status;
    if (filters.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters.search) {
      where.title = { contains: filters.search, mode: 'insensitive' };
    }

    return prisma.task.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  },

  async update(id: string, data: Prisma.TaskUpdateInput) {
    return prisma.task.update({
      where: { id },
      data,
      include: { project: true },
    });
  },

  async remove(id: string) {
    return prisma.task.delete({
      where: { id },
      include: { project: true },
    });
  },

  async getStatsByProject(projectId: string) {
    const [statusStats, assigneeStats] = await Promise.all([
      prisma.task.groupBy({
        by: ['status'],
        where: { projectId },
        _count: { id: true },
      }),
      prisma.task.groupBy({
        by: ['assigneeId'],
        where: { projectId },
        _count: { id: true },
      }),
    ]);

    return {
      byStatus: statusStats.reduce(
        (acc, curr) => ({ ...acc, [curr.status]: curr._count.id }),
        {}
      ),
      byAssignee: assigneeStats.reduce(
        (acc, curr) => ({ ...acc, [curr.assigneeId || 'unassigned']: curr._count.id }),
        {}
      ),
    };
  },
};
