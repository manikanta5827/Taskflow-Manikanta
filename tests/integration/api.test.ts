// @ts-nocheck
import { jest, describe, it, expect, beforeEach, beforeAll } from '@jest/globals';
import { app } from '../../src/index';
import * as jwt from '../../src/utils/jwt';

// Mock DB Repositories
jest.mock('../../src/repositories/userRepository', () => ({
  userRepository: {
    create: jest.fn(),
    findByEmail: jest.fn(),
    findActiveById: jest.fn(),
  },
}));

jest.mock('../../src/repositories/projectRepository', () => ({
  projectRepository: {
    create: jest.fn(),
    findActiveById: jest.fn(),
    findById: jest.fn(),
    findActiveForUser: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  },
}));

jest.mock('../../src/repositories/taskRepository', () => ({
  taskRepository: {
    create: jest.fn(),
    findActiveById: jest.fn(),
    findById: jest.fn(),
    findActiveByProject: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  },
}));

jest.mock('../../src/repositories/idempotencyRepository', () => ({
  idempotencyRepository: {
    create: jest.fn(),
    findById: jest.fn(),
    cleanupOldKeys: jest.fn(),
  },
}));

jest.mock('../../src/repositories/auditLogRepository', () => ({
  auditLogRepository: {
    create: jest.fn().mockResolvedValue(true),
    findLogs: jest.fn(),
  },
}));

import { userRepository } from '../../src/repositories/userRepository';
import { projectRepository } from '../../src/repositories/projectRepository';
import { taskRepository } from '../../src/repositories/taskRepository';
import { idempotencyRepository } from '../../src/repositories/idempotencyRepository';

describe('API Integration Tests', () => {
  const dummyUser = {
    id: 'u1',
    name: 'Test',
    email: 'test@example.com',
    password: 'hashed_pw',
    role: 'MEMBER',
  };
  let mockToken: string;

  beforeAll(async () => {
    mockToken = await jwt.signToken({ userId: 'u1', email: 'test@example.com' });
    if (globalThis.Bun) {
      (Bun.password as any).hash = jest.fn().mockResolvedValue('hashed_pw');
      (Bun.password as any).verify = jest.fn().mockResolvedValue(true);
    } else {
      (globalThis as any).Bun = {
        password: {
          hash: jest.fn().mockResolvedValue('hashed_pw'),
          verify: jest.fn().mockResolvedValue(true),
        },
      };
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (userRepository.findActiveById as jest.Mock).mockResolvedValue(dummyUser);
  });

  it('1. should register a new user successfully', async () => {
    (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
    (userRepository.create as jest.Mock).mockResolvedValue(dummyUser);

    const res = await app.request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', email: 'test@example.com', password: 'password123' }),
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as any;
    expect(body.token).toBeDefined();
    expect(body.user.email).toBe('test@example.com');
  });

  it('2. should enforce rate limiting (return 429)', async () => {
    (userRepository.findByEmail as jest.Mock).mockResolvedValue(dummyUser);

    // Auth limit is 5 per min. Fire 5 requests.
    for (let i = 0; i < 5; i++) {
      await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.0.1' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      });
    }

    // 6th request fails
    const res = await app.request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.0.1' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
    });

    expect(res.status).toBe(429);
  });

  it('3. should enforce RBAC (non-owner cannot update project)', async () => {
    const dummyProject = { id: 'p1', name: 'Proj 1', ownerId: 'u2' }; // User is u1, owner is u2
    (projectRepository.findById as jest.Mock).mockResolvedValue(dummyProject);

    const res = await app.request('/projects/p1', {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${mockToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Changed Name' }),
    });

    expect(res.status).toBe(403);
  });

  it('4. should delete project permanently', async () => {
    const dummyProject = { id: 'p1', name: 'Proj 1', ownerId: 'u1' };
    (projectRepository.findById as jest.Mock).mockResolvedValue(dummyProject);
    (projectRepository.remove as jest.Mock).mockResolvedValue(dummyProject);

    const res = await app.request('/projects/p1', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${mockToken}` },
    });
    expect(res.status).toBe(204);
    expect(projectRepository.remove).toHaveBeenCalledWith('p1');
  });

  it('5. should filter tasks by status and assignee', async () => {
    (taskRepository.findActiveByProject as jest.Mock).mockResolvedValue([
      { id: 't1', status: 'DONE' },
    ]);

    const res = await app.request('/projects/p1/tasks?status=DONE&assignee=u1', {
      method: 'GET',
      headers: { Authorization: `Bearer ${mockToken}` },
    });

    expect(res.status).toBe(200);
    expect(taskRepository.findActiveByProject).toHaveBeenCalledWith('p1', {
      status: 'DONE',
      assigneeId: 'u1',
      search: undefined,
    });
  });

  it('6. should respect Idempotency-Key and cache response', async () => {
    const dummyProject = {
      id: 'p1',
      name: 'Proj 1',
      ownerId: 'u1',
      description: 'Test Proj',
      createdAt: new Date().toISOString(),
    };

    // 1st request (Not cached)
    (idempotencyRepository.findById as jest.Mock).mockResolvedValue(null);
    (projectRepository.create as jest.Mock).mockResolvedValue(dummyProject);

    const res1 = await app.request('/projects', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${mockToken}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': 'key-789',
      },
      body: JSON.stringify({ name: 'Proj 1', description: 'Test Proj' }),
    });
    expect(res1.status).toBe(201);
    const body1 = await res1.json();
    expect(body1.id).toBe('p1');

    // Provide mocked caching logic - matching the composite key construction: key:userId:method:resource
    const compositeKey = 'key-789:u1:POST:/projects';
    (idempotencyRepository.findById as jest.Mock).mockImplementation((id) => {
      if (id === compositeKey) {
        return Promise.resolve({
          id: compositeKey,
          userId: 'u1',
          response: dummyProject,
        });
      }
      return Promise.resolve(null);
    });

    // 2nd request (Cached hit)
    const res2 = await app.request('/projects', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${mockToken}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': 'key-789',
      },
      body: JSON.stringify({ name: 'Proj 1' }),
    });

    expect(res2.status).toBe(200);
    const body2 = (await res2.json()) as any;
    expect(body2.cache).toBe(true);
    expect(body2.id).toBe('p1');
  });

  it('7. should isolate idempotency keys between users', async () => {
    const compositeKeyUser1 = 'shared-key:u1:POST:/projects';
    const compositeKeyUser2 = 'shared-key:u2:POST:/projects';

    const dummyProject = { id: 'p-new', name: 'New' };
    (projectRepository.create as jest.Mock).mockResolvedValue(dummyProject);

    // Mock hits for u1 but miss for u2
    (idempotencyRepository.findById as jest.Mock).mockImplementation((id) => {
      if (id === compositeKeyUser1) {
        return Promise.resolve({ response: { id: 'p1', name: 'Existing' } });
      }
      return Promise.resolve(null);
    });

    // User 2 makes a request with the same key
    const mockToken2 = await jwt.signToken({ userId: 'u2', email: 'test2@example.com' });
    (userRepository.findActiveById as jest.Mock).mockResolvedValue({ id: 'u2' });

    const res = await app.request('/projects', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${mockToken2}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': 'shared-key',
      },
      body: JSON.stringify({ name: 'New' }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.cache).toBeUndefined();
  });

  it('8. should support idempotency for PATCH requests', async () => {
    const dummyProject = { id: 'p1', name: 'Updated Name', ownerId: 'u1' };
    (projectRepository.findById as jest.Mock).mockResolvedValue(dummyProject);
    (projectRepository.update as jest.Mock).mockResolvedValue(dummyProject);

    const compositeKey = 'patch-key:u1:PATCH:/projects'; // /projects/:id -> /projects

    (idempotencyRepository.findById as jest.Mock).mockImplementation((id) => {
      if (id === compositeKey) {
        return Promise.resolve({ response: { id: 'p1', name: 'Cached Name' } });
      }
      return Promise.resolve(null);
    });

    const res = await app.request('/projects/p1', {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${mockToken}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': 'patch-key',
      },
      body: JSON.stringify({ name: 'Updated Name' }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.cache).toBe(true);
    expect(body.name).toBe('Cached Name');
  });

  it('9. should delete task permanently', async () => {
    const dummyTask = { id: 't1', title: 'Task 1', projectId: 'p1' };
    (taskRepository.findById as jest.Mock).mockResolvedValue(dummyTask);
    (taskRepository.remove as jest.Mock).mockResolvedValue(dummyTask);

    const res = await app.request('/tasks/t1', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${mockToken}` },
    });

    expect(res.status).toBe(204);
    expect(taskRepository.remove).toHaveBeenCalledWith('t1');
  });

  it('10. should return project stats', async () => {
    const dummyStats = {
      byStatus: { DONE: 5, TODO: 2 },
      byAssignee: { u1: 3, unassigned: 4 },
    };
    // Need to mock the new method added to taskRepository
    import('../../src/repositories/taskRepository').then((m) => {
      m.taskRepository.getStatsByProject = jest.fn().mockResolvedValue(dummyStats);
    });

    const res = await app.request('/projects/p1/stats', {
      method: 'GET',
      headers: { Authorization: `Bearer ${mockToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.byStatus.DONE).toBe(5);
  });

  it('11. should support pagination for projects', async () => {
    (projectRepository.findForUser as jest.Mock).mockResolvedValue([]);

    await app.request('/projects?page=2&limit=5', {
      method: 'GET',
      headers: { Authorization: `Bearer ${mockToken}` },
    });

    expect(projectRepository.findForUser).toHaveBeenCalledWith('u1', 5, 5);
  });

  it('12. should support pagination for tasks', async () => {
    (taskRepository.findByProject as jest.Mock).mockResolvedValue([]);

    await app.request('/projects/p1/tasks?page=3&limit=2', {
      method: 'GET',
      headers: { Authorization: `Bearer ${mockToken}` },
    });

    expect(taskRepository.findByProject).toHaveBeenCalledWith('p1', expect.any(Object), 4, 2);
  });
});
