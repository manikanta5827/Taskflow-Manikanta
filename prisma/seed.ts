import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  // Clean up existing data first
  await prisma.task.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});

  const hashedPassword = await Bun.password.hash('password123', { algorithm: 'bcrypt', cost: 12 });

  const user = await prisma.user.create({
    data: {
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
      role: 'MEMBER'
    }
  });
  console.log('Created test user:', user.email);

  const project = await prisma.project.create({
    data: {
      name: 'Tree Planting Q2 2026',
      description: 'Zomato Greening India initiative',
      ownerId: user.id
    }
  });

  await prisma.task.create({
    data: {
      title: 'Acquire saplings',
      description: 'Get saplings from the main nursery',
      status: 'DONE',
      priority: 'HIGH',
      projectId: project.id,
      assigneeId: user.id
    }
  });

  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  
  await prisma.task.create({
    data: {
      title: 'Organize volunteer drive',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      projectId: project.id,
      assigneeId: user.id,
      dueDate: nextMonth
    }
  });

  await prisma.task.create({
    data: {
      title: 'Prepare soil reports',
      status: 'TODO',
      priority: 'MEDIUM',
      projectId: project.id
    }
  });

  console.log('Database seeded successfully.');
  console.log('----------------------------------------------------');
  console.log('Test Credentials:');
  console.log('Email: test@example.com');
  console.log('Password: password123');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
