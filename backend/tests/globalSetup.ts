import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

module.exports = async () => {
  const prisma = new PrismaClient();
  await prisma.$connect();
  (global as any).__prismaClient = prisma;
};
