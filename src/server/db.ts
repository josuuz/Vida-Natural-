import 'server-only';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@/generated/prisma/client';

/**
 * Cliente único do Prisma.
 *
 * Em desenvolvimento o Next recarrega os módulos a cada alteração; guardar a
 * instância no globalThis evita abrir uma conexão nova a cada hot reload.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const url = process.env.DATABASE_URL ?? 'file:./prisma/dev.db';
  return new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url }),
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
