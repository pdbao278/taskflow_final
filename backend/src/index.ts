import 'dotenv/config';
import app from './app';
import { prisma } from './lib/prisma';
import { startScheduler } from './lib/scheduler';

const PORT = parseInt(process.env.PORT || '5000', 10);

async function connectWithRetry(attempt = 1): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
    startScheduler();
  } catch (err) {
    console.error(`⚠️  DB connection attempt ${attempt} failed. Retrying in 5s...`);
    await prisma.$disconnect();
    setTimeout(() => connectWithRetry(attempt + 1), 5000);
  }
}

async function main() {
  // Start HTTP server immediately so frontend doesn't get Network Error
  app.listen(PORT, () => {
    console.log(`🚀 Backend server running at http://localhost:${PORT}`);
  });

  // Connect to DB in background with retry
  await connectWithRetry();
}

main();
