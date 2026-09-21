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

/** Erros que significam "ainda não há banco", não "a consulta está errada". */
const NO_DATABASE_CODES = new Set(['P1000', 'P1001', 'P1003', 'P1010', 'P2021', 'P2022']);

let warned = false;

function isDatabaseMissing(error: unknown): boolean {
  const code = (error as { code?: unknown })?.code;
  if (typeof code === 'string' && NO_DATABASE_CODES.has(code)) return true;
  // o adapter do SQLite não repassa o código quando o arquivo não existe
  const message = error instanceof Error ? error.message : '';
  return /does not exist|no such table|unable to open database/i.test(message);
}

/**
 * Consulta o banco; se ele ainda não existe, devolve os dados locais.
 * Sem DATABASE_URL nem tentamos conectar, para não criar um SQLite vazio.
 */
export async function fromDatabase<T>(query: () => Promise<T>, fallback: () => T): Promise<T> {
  if (!process.env.DATABASE_URL) return fallback();
  try {
    return await query();
  } catch (error) {
    if (!isDatabaseMissing(error)) throw error;
    if (!warned) {
      warned = true;
      console.warn('[db] banco indisponivel — servindo dados locais (catalogo, carrinho e configuracoes)');
    }
    return fallback();
  }
}
