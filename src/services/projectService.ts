import { projectRepository } from '../repositories/projectRepository';
import { auditService } from './auditService';
import { NotFoundError } from '../utils/errors';

export const projectService = {
  async listProjects(userId: string, skip: number = 0, take: number = 10) {
    return projectRepository.findForUser(userId, skip, take);
  },

  async getProject(id: string) {
    const project = await projectRepository.findById(id);
    if (!project) throw new NotFoundError();
    return project;
  },

  async createProject(
    userId: string,
    data: { name: string; description?: string },
    ipAddress: string
  ) {
    const project = await projectRepository.create({
      ...data,
      ownerId: userId,
    });

    auditService.logAction({
      userId,
      action: 'project.created',
      entityType: 'project',
      entityId: project.id,
      ipAddress,
    });

    return project;
  },

  async updateProject(
    userId: string,
    id: string,
    data: { name?: string; description?: string },
    ipAddress: string
  ) {
    const existing = await projectRepository.findById(id);
    if (!existing) throw new NotFoundError();

    const project = await projectRepository.update(id, data);

    auditService.logAction({
      userId,
      action: 'project.updated',
      entityType: 'project',
      entityId: id,
      ipAddress,
    });

    return project;
  },

  async deleteProject(userId: string, id: string, ipAddress: string) {
    const existing = await projectRepository.findById(id);
    if (!existing) throw new NotFoundError();

    await projectRepository.remove(id);

    auditService.logAction({
      userId,
      action: 'project.deleted',
      entityType: 'project',
      entityId: id,
      ipAddress,
    });

    return { success: true };
  },
};
