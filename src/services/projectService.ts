import { projectRepository } from '../repositories/projectRepository';
import { auditService } from './auditService';
import { NotFoundError } from '../utils/errors';

export const projectService = {
  async listProjects(userId: string) {
    return projectRepository.findActiveForUser(userId);
  },

  async getProject(id: string) {
    const project = await projectRepository.findActiveById(id);
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
    const existing = await projectRepository.findActiveById(id);
    if (!existing) throw new NotFoundError();

    const project = await projectRepository.update(id, data);

    auditService.logAction({
      userId,
      action: 'project.updated',
      entityType: 'project',
      entityId: id,
      changes: { before: existing, after: project },
      ipAddress,
    });

    return project;
  },

  async softDeleteProject(userId: string, id: string, ipAddress: string) {
    const existing = await projectRepository.findActiveById(id);
    if (!existing) throw new NotFoundError();

    await projectRepository.softDelete(id);

    auditService.logAction({
      userId,
      action: 'project.deleted',
      entityType: 'project',
      entityId: id,
      ipAddress,
    });

    return { success: true };
  },

  async restoreProject(userId: string, id: string, ipAddress: string) {
    const existing = await projectRepository.findById(id);
    if (!existing) throw new NotFoundError();

    await projectRepository.restore(id);

    auditService.logAction({
      userId,
      action: 'project.restored',
      entityType: 'project',
      entityId: id,
      ipAddress,
    });

    return { success: true };
  },
};
