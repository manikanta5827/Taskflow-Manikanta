import { prisma } from '../src/config/prisma';

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await Bun.password.hash('password123', { algorithm: 'bcrypt', cost: 12 });

  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
      role: 'MEMBER',
    },
  });
  console.log('Test user ready:', user.email);

  let project = await prisma.project.findFirst({
    where: { name: 'Tree Planting Q2 2026', ownerId: user.id },
  });

  if (!project) {
    project = await prisma.project.create({
      data: {
        name: 'Tree Planting Q2 2026',
        description: 'Zomato Greening India initiative',
        ownerId: user.id,
      },
    });
    console.log('Created test project');
  }

  const tasks = [
    {
      title: 'Acquire saplings',
      description: 'Get saplings from the main nursery',
      status: 'DONE' as const,
      priority: 'HIGH' as const,
      projectId: project.id,
      assigneeId: user.id,
    },
    {
      title: 'Organize volunteer drive',
      status: 'IN_PROGRESS' as const,
      priority: 'HIGH' as const,
      projectId: project.id,
      assigneeId: user.id,
      dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    },
    {
      title: 'Prepare soil reports',
      status: 'TODO' as const,
      priority: 'MEDIUM' as const,
      projectId: project.id,
    },
  ];

  for (const taskData of tasks) {
    const existingTask = await prisma.task.findFirst({
      where: { title: taskData.title, projectId: project.id },
    });

    if (!existingTask) {
      await prisma.task.create({ data: taskData });
      console.log(`Created task: ${taskData.title}`);
    }
  }

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
