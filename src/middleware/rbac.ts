import { Context, Next } from 'hono';
import { ForbiddenError } from '../utils/errors.js';
import { projectRepository } from '../repositories/projectRepository.js';
import { taskRepository } from '../repositories/taskRepository.js';

export const requireRole = (roles: string[]) => {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    if (!roles.includes(user.role) && user.role !== 'ADMIN') {
      throw new ForbiddenError();
    }
    await next();
  };
};

export const requireProjectOwner = async (c: Context, next: Next) => {
  const user = c.get('user');
  if (user.role === 'ADMIN') return await next();

  const projectId = c.req.param('id') as string;
  const project = await projectRepository.findById(projectId);

  if (!project) {
    throw new ForbiddenError();
  }

  if (project.ownerId !== user.id) {
    throw new ForbiddenError();
  }
  await next();
};

export const requireTaskAccess = async (c: Context, next: Next) => {
  const user = c.get('user');
  if (user.role === 'ADMIN') return await next();

  const taskId = c.req.param('id') as string;
  const task = await taskRepository.findById(taskId);

  if (!task) {
    throw new ForbiddenError();
  }

  // Owner of project can do anything
  if (task.project.ownerId === user.id) {
    return await next();
  }

  // Assignee can update/delete task
  if (task.assigneeId === user.id) {
    return await next();
  }

  throw new ForbiddenError();
};
