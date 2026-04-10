import { taskRepository } from '../repositories/taskRepository';
import { userRepository } from '../repositories/userRepository';
import { auditService } from './auditService';
import { emailService } from './emailService';
import { NotFoundError } from '../utils/errors';

export const taskService = {
  async listTasks(projectId: string, filters: any) {
    return taskRepository.findByProject(projectId, filters);
  },

  async createTask(userId: string, projectId: string, data: any, ipAddress: string) {
    const task = await taskRepository.create({
      ...data,
      projectId,
      assigneeId: userId,
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    });

    auditService.logAction({
      userId,
      action: 'task.created',
      entityType: 'task',
      entityId: task.id,
      ipAddress,
    });

    if (task.assigneeId) {
      const assignee = await userRepository.findById(task.assigneeId);
      if (assignee) {
        emailService.sendTaskAssigned(assignee.email, task.title);
      }
    }

    return task;
  },

  async updateTask(userId: string, id: string, data: any, ipAddress: string) {
    const existing = await taskRepository.findById(id);
    if (!existing) throw new NotFoundError();

    const task = await taskRepository.update(id, data);

    if (data.status && data.status !== existing.status) {
      if (data.status === 'DONE') {
        auditService.logAction({
          userId,
          action: 'task.status.done',
          entityType: 'task',
          entityId: task.id,
          ipAddress,
        });
      } else {
        auditService.logAction({
          userId,
          action: 'task.updated',
          entityType: 'task',
          entityId: id,
          ipAddress,
        });
      }

      if (task.assigneeId) {
        const assignee = await userRepository.findById(task.assigneeId);
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
        ipAddress,
      });
      const assignee = await userRepository.findById(data.assigneeId);
      if (assignee) {
        emailService.sendTaskAssigned(assignee.email, task.title);
      }
    }

    return task;
  },

  async deleteTask(userId: string, id: string, ipAddress: string) {
    const existing = await taskRepository.findById(id);
    if (!existing) throw new NotFoundError();

    await taskRepository.remove(id);

    auditService.logAction({
      userId,
      action: 'task.deleted',
      entityType: 'task',
      entityId: id,
      ipAddress,
    });

    return { success: true };
  },
};
