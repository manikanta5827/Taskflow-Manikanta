import { PrismaClient } from '@prisma/client';
import { beforeEach, afterAll } from '@jest/globals';

const prisma = new PrismaClient();

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
