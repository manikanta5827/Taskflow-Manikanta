import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

export const projectRepository = {
  async create(data: Prisma.ProjectUncheckedCreateInput) {
    return prisma.project.create({ data });
  },

  async findById(id: string) {
    return prisma.project.findUnique({
      where: { id },
      include: { tasks: true },
    });
  },

  async findForUser(userId: string, skip: number = 0, take: number = 10) {
    return prisma.project.findMany({
      where: {
        OR: [{ ownerId: userId }, { tasks: { some: { assigneeId: userId } } }],
      },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  },

  async update(id: string, data: Prisma.ProjectUpdateInput) {
    return prisma.project.update({
      where: { id },
      data,
    });
  },

  async remove(id: string) {
    return prisma.project.delete({
      where: { id },
    });
  },
};
