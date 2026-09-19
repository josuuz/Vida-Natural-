/**
 * Extrai o texto das páginas institucionais de vidanat.com.br
 * (quem somos, frete, trocas e privacidade) para src/data/pages.json.
 *
 *   node scripts/scrape-pages.mjs [--fresh]
 */
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';

const ORIGIN = 'https://www.vidanat.com.br';
const CACHE = '.scrape';
const FRESH = process.argv.includes('--fresh');

const PAGES = [
  { slug: 'quem-somos', source: 'quem-somos', title: 'Quem somos' },
  { slug: 'pagamento-e-frete', source: 'meios-de-pagamento-e-de-frete', title: 'Meios de pagamento e de frete' },
  { slug: 'trocas-e-devolucoes', source: 'politica-de-trocas-e-devolucoes', title: 'Política de Trocas e Devoluções' },
  { slug: 'privacidade', source: 'politica-de-privacidade', title: 'Política de privacidade' },
];

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9',
  'Upgrade-Insecure-Requests': '1',
};

async function get(url, cacheFile) {
  const full = path.join(CACHE, cacheFile);
  if (!FRESH && existsSync(full)) return fs.readFile(full, 'utf8');
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${res.status} ao buscar ${url}`);
  const body = await res.text();
  await fs.writeFile(full, body);
  return body;
}

const clean = (value) => value.replace(/\s+/g, ' ').trim();

function parse(html) {
  const $ = cheerio.load(html);
  const root = $('h1').first().parent();
  const blocks = [];
  const seen = new Set();

  const push = (kind, text) => {
    const value = clean(text);
    if (!value || value.length < 2 || seen.has(`${kind}|${value}`)) return;
    seen.add(`${kind}|${value}`);
    blocks.push({ kind, text: value });
  };

  const walk = (node) => {
    $(node)
      .children()
      .each((_, child) => {
        const tag = child.tagName?.toLowerCase();
        if (!tag || tag === 'script' || tag === 'style' || tag === 'h1') return;
        const hasBlockChild = $(child)
          .children()
          .toArray()
          .some((c) => ['div', 'p', 'ul', 'ol', 'li', 'h2', 'h3', 'h4', 'table'].includes(c.tagName?.toLowerCase()));
        if (hasBlockChild) {
          walk(child);
          return;
        }
        const text = $(child).text();
        if (/^h[2-4]$/.test(tag)) push('heading', text);
        else if (tag === 'li') push('item', text);
        else {
          // um único <div>/<p> pode conter várias linhas separadas por <br>
          const html = $(child).html() ?? '';
          for (const part of html.split(/<br\b[^>]*>/gi)) {
            const line = clean(cheerio.load(`<x>${part}</x>`)('x').text());
            if (!line) continue;
            const isStrong = /<(strong|b)\b/i.test(part) && clean(cheerio.load(`<x>${part}</x>`)('strong,b').text()) === line;
            push(isStrong ? 'heading' : 'paragraph', line);
          }
        }
      });
  };

  walk(root);
  return blocks;
}

const out = [];
for (const page of PAGES) {
  const html = await get(`${ORIGIN}/pagina/${page.source}.html`, `pg-${page.source}.html`);
  out.push({ ...page, blocks: parse(html) });
  console.log(`${page.slug}: ${out.at(-1).blocks.length} blocos`);
}

await fs.mkdir('src/data', { recursive: true });
await fs.writeFile('src/data/pages.json', `${JSON.stringify(out, null, 2)}\n`);
