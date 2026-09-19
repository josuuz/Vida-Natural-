/**
 * Percorre o site inteiro conferindo links internos, imagens e metadados.
 *
 *   node scripts/test-links.mjs
 */
import { chromium } from 'playwright';
import catalog from '../src/data/catalog.json' with { type: 'json' };
const B = 'http://localhost:3100';
const urls = [
  '/', '/produtos', '/sobre', '/contato',
  ...catalog.categories.map((c) => `/categoria/${c.slug}`),
  ...catalog.products.map((p) => `/produtos/${p.slug}`),
  '/politicas/privacidade', '/politicas/trocas-e-devolucoes', '/politicas/pagamento-e-frete',
  '/checkout', '/pedidos',
];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const problems = [];
const links = new Set();
for (const url of urls) {
  const bad = [];
  page.removeAllListeners('response');
  page.on('response', (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url().replace(B, '')}`); });
  const res = await page.goto(B + url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  if (res.status() !== 200) problems.push(`${url} → HTTP ${res.status()}`);
  await page.waitForTimeout(250);
  const info = await page.evaluate(() => ({
    broken: Array.from(document.querySelectorAll('img')).filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src),
    hrefs: Array.from(document.querySelectorAll('a[href^="/"]')).map((a) => a.getAttribute('href')),
    h1: document.querySelectorAll('h1').length,
    title: document.title,
    desc: document.querySelector('meta[name="description"]')?.content?.length ?? 0,
    noAlt: Array.from(document.querySelectorAll('img')).filter((i) => i.alt === null).length,
  }));
  info.hrefs.forEach((h) => links.add(h.split('#')[0].split('?')[0]));
  if (info.broken.length) problems.push(`${url} → imagens quebradas: ${info.broken.slice(0, 2)}`);
  if (info.h1 !== 1) problems.push(`${url} → ${info.h1} h1`);
  if (!info.title || info.title.length < 10) problems.push(`${url} → title curto: "${info.title}"`);
  const noIndexPages = ['/checkout', '/pedidos'];
  if (info.desc < 40 && !noIndexPages.includes(url)) problems.push(`${url} → description curta (${info.desc})`);
  if (bad.length) problems.push(`${url} → requisições: ${bad.slice(0, 2).join(', ')}`);
}
// verifica todos os links internos encontrados
const checked = new Set(urls);
for (const link of links) {
  if (checked.has(link) || !link.startsWith('/')) continue;
  checked.add(link);
  const res = await page.goto(B + link, { waitUntil: 'domcontentloaded', timeout: 60000 });
  if (res.status() !== 200) problems.push(`link interno quebrado: ${link} → ${res.status()}`);
}
await browser.close();
console.log(`páginas verificadas: ${urls.length} | links internos únicos: ${links.size}`);
console.log(problems.length ? 'PROBLEMAS:\n' + problems.join('\n') : 'Nenhum problema encontrado.');
