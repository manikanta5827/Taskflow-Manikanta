import { Hono } from 'hono';
import { authController } from '../controllers/authController';
import { projectController } from '../controllers/projectController';
import { taskController } from '../controllers/taskController';
import { systemController } from '../controllers/systemController';
import { authMiddleware } from '../middleware/auth';
import { requireRole, requireProjectOwner, requireTaskAccess } from '../middleware/rbac';
import { rateLimitAuth, rateLimitTask, rateLimitGeneral } from '../middleware/rateLimit';
import { idempotencyMiddleware } from '../middleware/idempotency';
import { AppVariables } from '../types/index';

export const routes = new Hono<{ Variables: AppVariables }>();

// Auth routes
routes.post('/auth/register', rateLimitAuth, authController.register);
routes.post('/auth/login', rateLimitAuth, authController.login);

// Health check route
routes.get('/health', systemController.health);

// Protected routes - Apply middleware ONLY to these paths
const protectedPaths = ['/projects', '/projects/*', '/tasks', '/tasks/*', '/audit-logs'];

protectedPaths.forEach((path) => {
  routes.use(path, authMiddleware, rateLimitGeneral, idempotencyMiddleware);
});

// Audit logs route for admin only
routes.get('/audit-logs', requireRole(['ADMIN']), systemController.getAuditLogs);

// Project routes
routes.get('/projects', projectController.list);
routes.post('/projects', projectController.create);
routes.get('/projects/:id', projectController.get);
routes.patch('/projects/:id', requireProjectOwner, projectController.update);
routes.delete('/projects/:id', requireProjectOwner, projectController.remove);
routes.get('/projects/:id/stats', projectController.getStats);

// Task routes
routes.get('/projects/:id/tasks', taskController.list);
routes.post('/projects/:id/tasks', rateLimitTask, requireProjectOwner, taskController.create);

routes.patch('/tasks/:id', requireTaskAccess, taskController.update);
routes.delete('/tasks/:id', requireTaskAccess, taskController.remove);
routes.get('/tasks/:id/logs', requireTaskAccess, taskController.getLogs);
