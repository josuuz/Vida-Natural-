import pagesJson from '@/data/pages.json';

export type PageBlock = { kind: 'heading' | 'paragraph' | 'item'; text: string };
export type InstitutionalPage = { slug: string; source: string; title: string; blocks: PageBlock[] };

export const institutionalPages = pagesJson as InstitutionalPage[];

export function getPage(slug: string) {
  return institutionalPages.find((page) => page.slug === slug);
}

/** Páginas publicadas em /politicas. "quem-somos" vira a página /sobre. */
export const policyPages = institutionalPages.filter((page) => page.slug !== 'quem-somos');
