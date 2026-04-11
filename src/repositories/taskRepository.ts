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

    // Fetch names for assignees
    const assigneeIds = assigneeStats
      .map((s) => s.assigneeId)
      .filter((id): id is string => id !== null);

    const users = await prisma.user.findMany({
      where: { id: { in: assigneeIds } },
      select: { id: true, name: true },
    });

    const userMap = users.reduce(
      (acc, user) => ({ ...acc, [user.id]: user.name }),
      {} as Record<string, string>
    );

    return {
      byStatus: statusStats.reduce((acc, curr) => ({ ...acc, [curr.status]: curr._count.id }), {}),
      byAssignee: assigneeStats.reduce((acc, curr) => {
        const key = curr.assigneeId ? userMap[curr.assigneeId] || 'Unknown' : 'unassigned';
        return { ...acc, [key]: curr._count.id };
      }, {}),
    };
  },
};
