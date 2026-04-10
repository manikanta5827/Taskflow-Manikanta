import { Context } from 'hono';
import { taskService } from '../services/taskService';
import { auditLogRepository } from '../repositories/auditLogRepository';
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

const queryListTasksSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  assignee: z.string().uuid().optional(),
  search: z.string().optional(),
});

const paramsIdSchema = z.object({
  id: z.string().uuid(),
});

export const taskController = {
  async list(c: Context) {
    const { id: projectId } = paramsIdSchema.parse(c.req.param());
    const query = queryListTasksSchema.parse(c.req.query());
    const tasks = await taskService.listTasks(projectId, {
      status: query.status,
      assigneeId: query.assignee,
      search: query.search,
    });
    return c.json(tasks);
  },

  async create(c: Context) {
    const user = c.get('user');
    const { id: projectId } = paramsIdSchema.parse(c.req.param());
    const body = await c.req.json();
    const data = createTaskSchema.parse(body);
    const ip = c.get('clientIp');
    const task = await taskService.createTask(user.id, projectId, data, ip);
    return c.json(task, 201);
  },

  async update(c: Context) {
    const user = c.get('user');
    const { id } = paramsIdSchema.parse(c.req.param());
    const body = await c.req.json();
    const data = updateTaskSchema.parse(body);
    const ip = c.get('clientIp');
    const task = await taskService.updateTask(user.id, id, data, ip);
    return c.json(task);
  },

  async remove(c: Context) {
    const user = c.get('user');
    const { id } = paramsIdSchema.parse(c.req.param());
    const ip = c.get('clientIp');
    await taskService.softDeleteTask(user.id, id, ip);
    return new Response(null, { status: 204 });
  },

  async restore(c: Context) {
    const user = c.get('user');
    const { id } = paramsIdSchema.parse(c.req.param());
    const ip = c.get('clientIp');
    await taskService.restoreTask(user.id, id, ip);
    return c.json({ success: true });
  },

  async getLogs(c: Context) {
    const { id } = paramsIdSchema.parse(c.req.param());
    const logs = await auditLogRepository.findLogs({ entityType: 'task', entityId: id });
    return c.json(logs);
  },
};
