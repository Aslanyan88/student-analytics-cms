// server/src/utils/prisma.ts
import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // Use global variable to prevent multiple instances during hot-reloading
  if (!(global as any).prisma) {
    (global as any).prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
  }
  prisma = (global as any).prisma;
}

export default prisma;