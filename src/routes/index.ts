import { Hono } from 'hono';
import { authController } from '../controllers/authController.js';
import { projectController } from '../controllers/projectController.js';
import { taskController } from '../controllers/taskController.js';
import { systemController } from '../controllers/systemController.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole, requireProjectOwner, requireTaskAccess } from '../middleware/rbac.js';
import { rateLimitAuth, rateLimitTask, rateLimitGeneral } from '../middleware/rateLimit.js';
import { idempotencyMiddleware } from '../middleware/idempotency.js';
import { AppVariables } from '../types/index.js';

export const routes = new Hono<{ Variables: AppVariables }>();

routes.post('/auth/register', rateLimitAuth, authController.register);
routes.post('/auth/login', rateLimitAuth, authController.login);

routes.get('/health', systemController.health);

routes.use('/*', authMiddleware, rateLimitGeneral, idempotencyMiddleware);

routes.get('/audit-logs', requireRole(['ADMIN']), systemController.getAuditLogs);

routes.get('/projects', projectController.list);
routes.post('/projects', projectController.create);
routes.get('/projects/:id', projectController.get);
routes.patch('/projects/:id', requireProjectOwner, projectController.update);
routes.delete('/projects/:id', requireProjectOwner, projectController.remove);
routes.post('/projects/:id/restore', requireProjectOwner, projectController.restore);

routes.get('/projects/:id/tasks', taskController.list);
routes.post('/projects/:id/tasks', rateLimitTask, requireProjectOwner, taskController.create);

routes.patch('/tasks/:id', requireTaskAccess, taskController.update);
routes.delete('/tasks/:id', requireTaskAccess, taskController.remove);
routes.post('/tasks/:id/restore', requireTaskAccess, taskController.restore);
routes.get('/tasks/:id/logs', requireTaskAccess, taskController.getLogs);
