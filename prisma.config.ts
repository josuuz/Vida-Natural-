import path from 'node:path';
import { defineConfig } from 'prisma/config';

/**
 * Configuração do Prisma CLI (migrations, studio, seed).
 * A URL do banco vive aqui e nunca no schema — regra do Prisma 7.
 */
export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    path: path.join('prisma', 'migrations'),
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db',
  },
});
