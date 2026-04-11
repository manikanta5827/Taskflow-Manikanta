import { prisma } from '../src/config/prisma';
import { jest, beforeEach, afterAll } from '@jest/globals';

// Mock the Bun global for Node.js test environment (Jest)
(globalThis as any).Bun = {
  password: {
    hash: jest.fn().mockImplementation(() => Promise.resolve('hashed_pw')),
    verify: jest.fn().mockImplementation(() => Promise.resolve(true)),
  },
  env: process.env,
};

// Mock hono/bun which depends on the Bun global at the module level
jest.mock('hono/bun', () => ({
  getConnInfo: () => ({
    remote: { address: '127.0.0.1' },
  }),
}));

beforeEach(async () => {
  await prisma.task.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.idempotencyKey.deleteMany({});
  await prisma.user.deleteMany({});
});

afterAll(async () => {
  await prisma.$disconnect();
});
