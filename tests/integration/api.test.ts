// @ts-nocheck
import { jest, describe, it, expect, beforeEach, beforeAll } from '@jest/globals';
import { app } from '../../src/index.js';
import * as jwt from '../../src/utils/jwt.js';

// Mock DB Repositories
jest.mock('../../src/repositories/userRepository.js', () => ({
  userRepository: {
    create: jest.fn(),
    findByEmail: jest.fn(),
    findActiveById: jest.fn(),
  }
}));

jest.mock('../../src/repositories/projectRepository.js', () => ({
  projectRepository: {
    create: jest.fn(),
    findActiveById: jest.fn(),
    findById: jest.fn(),
    findActiveForUser: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    restore: jest.fn(),
  }
}));

jest.mock('../../src/repositories/taskRepository.js', () => ({
  taskRepository: {
    create: jest.fn(),
    findActiveById: jest.fn(),
    findById: jest.fn(),
    findActiveByProject: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    restore: jest.fn(),
  }
}));

jest.mock('../../src/repositories/idempotencyRepository.js', () => ({
  idempotencyRepository: {
    create: jest.fn(),
    findByIdAndUser: jest.fn(),
    cleanupOldKeys: jest.fn(),
  }
}));

jest.mock('../../src/repositories/auditLogRepository.js', () => ({
  auditLogRepository: {
    create: jest.fn().mockResolvedValue(true),
    findLogs: jest.fn(),
  }
}));

import { userRepository } from '../../src/repositories/userRepository.js';
import { projectRepository } from '../../src/repositories/projectRepository.js';
import { taskRepository } from '../../src/repositories/taskRepository.js';
import { idempotencyRepository } from '../../src/repositories/idempotencyRepository.js';

describe('API Integration Tests', () => {

  const dummyUser = { id: 'u1', name: 'Test', email: 'test@example.com', password: 'hashed_pw', role: 'MEMBER' };
  const mockToken = jwt.signToken({ userId: 'u1', email: 'test@example.com' });

  beforeAll(() => {
    if (!globalThis.Bun) {
      (globalThis as any).Bun = {
        password: {
          hash: jest.fn().mockResolvedValue('hashed_pw'),
          verify: jest.fn().mockResolvedValue(true)
        }
      };
    } else {
      (Bun.password as any).hash = jest.fn().mockResolvedValue('hashed_pw');
      (Bun.password as any).verify = jest.fn().mockResolvedValue(true);
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
      body: JSON.stringify({ name: 'Test', email: 'test@example.com', password: 'password123' })
    });

    expect(res.status).toBe(201);
    const body = await res.json() as any;
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
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
      });
    }

    // 6th request fails
    const res = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.0.1' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
    });

    expect(res.status).toBe(429);
  });

  it('3. should enforce RBAC (non-owner cannot update project)', async () => {
    const dummyProject = { id: 'p1', name: 'Proj 1', ownerId: 'u2' }; // User is u1, owner is u2
    (projectRepository.findById as jest.Mock).mockResolvedValue(dummyProject);

    const res = await app.request('/projects/p1', {
      method: 'PATCH',
      headers: { 
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ name: 'Changed Name' })
    });

    expect(res.status).toBe(403);
  });

  it('4. should soft delete and restore project', async () => {
    const dummyProject = { id: 'p1', name: 'Proj 1', ownerId: 'u1' }; // User is u1, owner is u1
    (projectRepository.findById as jest.Mock).mockResolvedValue(dummyProject);
    (projectRepository.findActiveById as jest.Mock).mockResolvedValue(dummyProject);
    (projectRepository.softDelete as jest.Mock).mockResolvedValue(dummyProject);

    const resDelete = await app.request('/projects/p1', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${mockToken}` }
    });
    expect(resDelete.status).toBe(204);
    expect(projectRepository.softDelete).toHaveBeenCalledWith('p1');

    const resRestore = await app.request('/projects/p1/restore', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${mockToken}` }
    });
    expect(resRestore.status).toBe(200);
    expect(projectRepository.restore).toHaveBeenCalledWith('p1');
  });

  it('5. should filter tasks by status and assignee', async () => {
    (taskRepository.findActiveByProject as jest.Mock).mockResolvedValue([{ id: 't1', status: 'DONE' }]);

    const res = await app.request('/projects/p1/tasks?status=DONE&assignee=u1', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${mockToken}` }
    });

    expect(res.status).toBe(200);
    expect(taskRepository.findActiveByProject).toHaveBeenCalledWith('p1', { status: 'DONE', assigneeId: 'u1', search: undefined });
  });

  it('6. should respect Idempotency-Key and cache response', async () => {
    const dummyProject = { id: 'p1', name: 'Proj 1', ownerId: 'u1' };
    
    // 1st request (Not cached)
    (idempotencyRepository.findByIdAndUser as jest.Mock).mockResolvedValue(null);
    (projectRepository.create as jest.Mock).mockResolvedValue(dummyProject);

    const res1 = await app.request('/projects', {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': 'key-789'
        },
        body: JSON.stringify({ name: 'Proj 1' })
    });
    expect(res1.status).toBe(201);

    // Provide mocked caching logic
    (idempotencyRepository.findByIdAndUser as jest.Mock).mockResolvedValue({ response: { cached: true, name: 'Proj 1' } });
    
    // 2nd request (Cached hit)
    const res2 = await app.request('/projects', {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': 'key-789'
        },
        body: JSON.stringify({ name: 'Proj 1' })
    });
    
    expect(res2.status).toBe(200);
    const body2 = await res2.json() as any;
    expect(body2.cached).toBe(true);
  });
});
