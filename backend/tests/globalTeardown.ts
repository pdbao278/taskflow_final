import { PrismaClient } from '@prisma/client';

module.exports = async () => {
  const prisma = new PrismaClient();
  // Cleanup test data
  try {
    await prisma.user.deleteMany({ where: { email: { contains: 'taskflow-test.com' } } });
  } catch {}
  await prisma.$disconnect();
};
