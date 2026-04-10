import { taskRepository } from '../repositories/taskRepository';
import { userRepository } from '../repositories/userRepository';
import { auditService } from './auditService';
import { emailService } from './emailService';
import { NotFoundError } from '../utils/errors';

export const taskService = {
  async listTasks(projectId: string, filters: any) {
    return taskRepository.findActiveByProject(projectId, filters);
  },

  async createTask(userId: string, projectId: string, data: any, ipAddress: string) {
    const task = await taskRepository.create({
      ...data,
      projectId,
    });

    auditService.logAction({
      userId,
      action: 'task.created',
      entityType: 'task',
      entityId: task.id,
      ipAddress,
    });

    if (task.assigneeId) {
      const assignee = await userRepository.findActiveById(task.assigneeId);
      if (assignee) {
        emailService.sendTaskAssigned(assignee.email, task.title);
      }
    }

    return task;
  },

  async updateTask(userId: string, id: string, data: any, ipAddress: string) {
    const existing = await taskRepository.findActiveById(id);
    if (!existing) throw new NotFoundError();

    const task = await taskRepository.update(id, data);

    auditService.logAction({
      userId,
      action: 'task.updated',
      entityType: 'task',
      entityId: id,
      changes: { before: existing, after: task },
      ipAddress,
    });

    if (data.status && data.status !== existing.status) {
      if (data.status === 'DONE') {
        auditService.logAction({
          userId,
          action: 'task.status.done',
          entityType: 'task',
          entityId: task.id,
          ipAddress,
        });
      }

      if (task.assigneeId) {
        const assignee = await userRepository.findActiveById(task.assigneeId);
        if (assignee) {
          emailService.sendStatusChanged(assignee.email, task.title, task.status);
        }
      }
    }

    if (data.assigneeId && data.assigneeId !== existing.assigneeId) {
      auditService.logAction({
        userId,
        action: 'task.reassigned',
        entityType: 'task',
        entityId: task.id,
        changes: { before: existing.assigneeId, after: data.assigneeId },
        ipAddress,
      });
      const assignee = await userRepository.findActiveById(data.assigneeId);
      if (assignee) {
        emailService.sendTaskAssigned(assignee.email, task.title);
      }
    }

    return task;
  },

  async softDeleteTask(userId: string, id: string, ipAddress: string) {
    const existing = await taskRepository.findActiveById(id);
    if (!existing) throw new NotFoundError();

    await taskRepository.softDelete(id);

    auditService.logAction({
      userId,
      action: 'task.deleted',
      entityType: 'task',
      entityId: id,
      ipAddress,
    });

    return { success: true };
  },

  async restoreTask(userId: string, id: string, ipAddress: string) {
    const existing = await taskRepository.findById(id);
    if (!existing) throw new NotFoundError();

    await taskRepository.restore(id);

    auditService.logAction({
      userId,
      action: 'task.restored',
      entityType: 'task',
      entityId: id,
      ipAddress,
    });

    return { success: true };
  },
};
