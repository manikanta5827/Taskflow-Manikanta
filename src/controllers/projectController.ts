import { Context } from 'hono';
import { projectService } from '../services/projectService.js';
import { z } from 'zod';

const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

export const projectController = {
  async list(c: Context) {
    const user = c.get('user');
    const projects = await projectService.listProjects(user.id);
    return c.json(projects);
  },

  async get(c: Context) {
    const id = c.req.param('id') as string;
    const project = await projectService.getProject(id);
    return c.json(project);
  },

  async create(c: Context) {
    const user = c.get('user');
    const body = await c.req.json();
    const data = createProjectSchema.parse(body);
    const ip = c.req.header('x-forwarded-for') || 'unknown';
    const project = await projectService.createProject(user.id, data, ip);
    return c.json(project, 201);
  },

  async update(c: Context) {
    const user = c.get('user');
    const id = c.req.param('id') as string;
    const body = await c.req.json();
    const data = updateProjectSchema.parse(body);
    const ip = c.req.header('x-forwarded-for') || 'unknown';
    const project = await projectService.updateProject(user.id, id, data, ip);
    return c.json(project);
  },

  async remove(c: Context) {
    const user = c.get('user');
    const id = c.req.param('id') as string;
    const ip = c.req.header('x-forwarded-for') || 'unknown';
    await projectService.softDeleteProject(user.id, id, ip);
    return new Response(null, { status: 204 });
  },

  async restore(c: Context) {
    const user = c.get('user');
    const id = c.req.param('id') as string;
    const ip = c.req.header('x-forwarded-for') || 'unknown';
    await projectService.restoreProject(user.id, id, ip);
    return c.json({ success: true });
  },
};
