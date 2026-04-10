import { Context } from 'hono';
import { taskService } from '../services/taskService.js';
import { auditLogRepository } from '../repositories/auditLogRepository.js';
import { z } from 'zod';

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  assigneeId: z.string().uuid().optional(),
  dueDate: z
    .string()
    .datetime()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
});

const updateTaskSchema = createTaskSchema.partial();

export const taskController = {
  async list(c: Context) {
    const projectId = c.req.param('id') as string;
    const { status, assignee, search } = c.req.query();
    const tasks = await taskService.listTasks(projectId, { status, assigneeId: assignee, search });
    return c.json(tasks);
  },

  async create(c: Context) {
    const user = c.get('user');
    const projectId = c.req.param('id') as string;
    const body = await c.req.json();
    const data = createTaskSchema.parse(body);
    const ip = c.req.header('x-forwarded-for') || 'unknown';
    const task = await taskService.createTask(user.id, projectId, data, ip);
    return c.json(task, 201);
  },

  async update(c: Context) {
    const user = c.get('user');
    const id = c.req.param('id') as string;
    const body = await c.req.json();
    const data = updateTaskSchema.parse(body);
    const ip = c.req.header('x-forwarded-for') || 'unknown';
    const task = await taskService.updateTask(user.id, id, data, ip);
    return c.json(task);
  },

  async remove(c: Context) {
    const user = c.get('user');
    const id = c.req.param('id') as string;
    const ip = c.req.header('x-forwarded-for') || 'unknown';
    await taskService.softDeleteTask(user.id, id, ip);
    return new Response(null, { status: 204 });
  },

  async restore(c: Context) {
    const user = c.get('user');
    const id = c.req.param('id') as string;
    const ip = c.req.header('x-forwarded-for') || 'unknown';
    await taskService.restoreTask(user.id, id, ip);
    return c.json({ success: true });
  },

  async getLogs(c: Context) {
    const id = c.req.param('id') as string;
    const logs = await auditLogRepository.findLogs({ entityType: 'task', entityId: id });
    return c.json(logs);
  },
};
