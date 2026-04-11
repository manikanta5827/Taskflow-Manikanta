import { Context } from 'hono';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';
import { z } from 'zod';

const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

const paramsIdSchema = z.object({
  id: z.string().uuid(),
});

const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 10)),
});

export const projectController = {
  async list(c: Context) {
    const user = c.get('user');
    const { page, limit } = paginationSchema.parse(c.req.query());
    const skip = (page - 1) * limit;
    const projects = await projectService.listProjects(user.id, skip, limit);
    return c.json(projects);
  },

  async get(c: Context) {
    const { id } = paramsIdSchema.parse(c.req.param());
    const project = await projectService.getProject(id);
    return c.json(project);
  },

  async create(c: Context) {
    const user = c.get('user');
    const body = await c.req.json();
    const data = createProjectSchema.parse(body);
    const ip = c.get('clientIp');
    const project = await projectService.createProject(user.id, data, ip);
    return c.json(project, 201);
  },

  async update(c: Context) {
    const user = c.get('user');
    const { id } = paramsIdSchema.parse(c.req.param());
    const body = await c.req.json();
    const data = updateProjectSchema.parse(body);
    const ip = c.get('clientIp');
    const project = await projectService.updateProject(user.id, id, data, ip);
    return c.json(project);
  },

  async remove(c: Context) {
    const user = c.get('user');
    const { id } = paramsIdSchema.parse(c.req.param());
    const ip = c.get('clientIp');
    await projectService.deleteProject(user.id, id, ip);
    return new Response(null, { status: 204 });
  },

  async getStats(c: Context) {
    const { id } = paramsIdSchema.parse(c.req.param());
    const stats = await taskService.getProjectStats(id);
    return c.json(stats);
  },
};
