/**
 * Extrai o catálogo real da loja Vida Natural (vidanat.com.br) e baixa as
 * imagens oficiais dos produtos.
 *
 *   node scripts/scrape-catalog.mjs          # usa cache em .scrape/
 *   node scripts/scrape-catalog.mjs --fresh  # rebaixa todo o HTML
 *
 * Saídas:
 *   src/data/catalog.json    catálogo estruturado
 *   public/produtos/*.jpg    imagens oficiais otimizadas
 */
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';
import sharp from 'sharp';

const ORIGIN = 'https://www.vidanat.com.br';
const CACHE = '.scrape';
const IMG_OUT = 'public/produtos';
const FRESH = process.argv.includes('--fresh');

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
};

async function get(url, cacheFile) {
  const full = path.join(CACHE, cacheFile);
  if (!FRESH && existsSync(full)) return fs.readFile(full, 'utf8');
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${res.status} ao buscar ${url}`);
  const body = await res.text();
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, body);
  return body;
}

const clean = (s) => s.replace(/\s+/g, ' ').trim();
const brl = (s) => parseFloat(String(s).replace(/\./g, '').replace(',', '.'));

/* ---------------------------------------------------------------- descrição */

const BLOCK = new Set(['div', 'p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'ul', 'ol']);
const EMOJI = /^([\p{Extended_Pictographic} -㌀️]+)\s*/u;

/** Converte o HTML colado do Google Docs em blocos limpos. */
function parseDescription($, root) {
  const blocks = [];

  const emit = (html) => {
    for (const segment of html.split(/<br\b[^>]*>/gi)) {
      const $seg = cheerio.load(`<x>${segment}</x>`);
      const raw = clean($seg('x').text());
      if (!raw || raw.length < 2) continue;

      const strongText = clean($seg('x').find('strong,b').first().text());
      const emojiMatch = raw.match(EMOJI);
      const emoji = emojiMatch ? emojiMatch[1] : null;
      const body = emoji ? raw.slice(emojiMatch[0].length) : raw;

      if (strongText && clean(body) === strongText) {
        blocks.push({ kind: 'heading', emoji, text: strongText });
      } else if (strongText && body.startsWith(strongText)) {
        const rest = body.slice(strongText.length).replace(/^\s*[:–—-]\s*/, '');
        blocks.push({ kind: 'feature', emoji, label: strongText, text: clean(rest) });
      } else {
        blocks.push({ kind: 'paragraph', emoji, text: clean(body) });
      }
    }
  };

  const walk = (node) => {
    for (const child of $(node).children().toArray()) {
      const tag = child.tagName?.toLowerCase();
      if (!tag) continue;
      const hasBlockChild = $(child)
        .children()
        .toArray()
        .some((c) => BLOCK.has(c.tagName?.toLowerCase()));
      if (BLOCK.has(tag) && !hasBlockChild) emit($(child).html() ?? '');
      else if (hasBlockChild) walk(child);
    }
  };

  walk(root);

  // remove duplicatas preservando ordem
  const seen = new Set();
  return blocks.filter((b) => {
    const key = `${b.kind}|${b.label ?? ''}|${b.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/* ------------------------------------------------------------------ produto */

function parseProduct(html, url) {
  const $ = cheerio.load(html);
  const slug = url.split('/').pop();

  const name = clean($('h1.nome-produto').first().text());
  const sku = clean($('[itemprop="sku"]').first().text()) || null;

  const crumbs = $('.breadcrumbs a')
    .toArray()
    .map((a) => ({ href: $(a).attr('href') ?? '', name: clean($(a).text()) }))
    .filter((c) => c.href.startsWith(ORIGIN) && !/\/$|categorias-de-produtos/.test(c.href))
    .map((c) => ({ slug: c.href.replace(`${ORIGIN}/`, ''), name: c.name }));
  const category = crumbs.at(-1) ?? null;

  const $acoes = $('.acoes-produto').first();
  const price = parseFloat($acoes.find('[data-sell-price]').first().attr('data-sell-price') ?? '') || null;
  const fromText = clean($acoes.find('s.preco-venda').first().text()).replace(/^R\$\s*/, '');
  const priceFrom = fromText ? brl(fromText) : null;

  const $parcela = $acoes.find('.preco-parcela').first();
  const parcelaText = clean($parcela.text());
  const pm = parcelaText.match(/(\d+)x\s*de\s*R\$\s*([\d.,]+)/i);
  const installments = pm ? { count: Number(pm[1]), value: brl(pm[2]) } : null;

  const available = $acoes.hasClass('disponivel');

  // data-imagem-grande só existe na galeria do próprio produto (o título de cada
  // âncora repete o nome do produto); um regex global pegaria "compre junto"
  const ogImage = $('meta[property="og:image"]').attr('content') ?? null;
  const gallery = [
    ...new Set(
      [
        ...$('a[data-imagem-grande]')
          .toArray()
          .map((el) => $(el).attr('data-imagem-grande')),
        ogImage,
      ]
        .filter(Boolean)
        .map((src) => src.replace(/\/\d+x\d+\//, '/2500x2500/'))
    ),
  ];
  // tabelas nutricionais ficam fora da galeria principal
  const isTable = (src) => /tabela|nutricional|info/i.test(src);
  const images = gallery.filter((src) => !isTable(src));
  const infoImages = gallery.filter(isTable);

  const description = parseDescription($, $('#descricao')[0]);
  const metaDescription = $('meta[name="description"]').attr('content') ?? null;

  // peso / volume extraído do próprio nome (ex.: "- 100g", "| 30ml")
  const sizeMatch = name.match(/(\d+(?:[.,]\d+)?)\s*(g|kg|ml|l)\b/i);
  const size = sizeMatch ? `${sizeMatch[1]}${sizeMatch[2].toLowerCase()}` : null;

  return {
    slug,
    url,
    sku,
    name,
    category,
    price,
    priceFrom,
    installments,
    available,
    size,
    images,
    infoImages,
    description,
    metaDescription: metaDescription ? clean(metaDescription) : null,
  };
}

/* -------------------------------------------------------------------- main  */

async function download(sources, slug, prefix) {
  const local = [];
  for (const [i, src] of sources.entries()) {
    const file = `${slug}${prefix}${i + 1}.jpg`;
    const dest = path.join(IMG_OUT, file);
    if (!existsSync(dest) || FRESH) {
      const res = await fetch(src, { headers: { 'User-Agent': HEADERS['User-Agent'] } });
      if (!res.ok) {
        console.warn(`  ! imagem ${res.status}: ${src}`);
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      await sharp(buf)
        .resize(1400, 1400, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 86, mozjpeg: true })
        .toFile(dest);
    }
    const meta = await sharp(dest).metadata();
    local.push({ src: `/produtos/${file}`, width: meta.width, height: meta.height });
  }
  return local;
}

async function downloadImages(products) {
  await fs.mkdir(IMG_OUT, { recursive: true });
  for (const product of products) {
    product.localImages = await download(product.images, product.slug, '-');
    product.localInfoImages = await download(product.infoImages, product.slug, '-info-');
  }
}

async function main() {
  const sitemap = await get(`${ORIGIN}/sitemap/product-1.xml`, 'products.xml');
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  console.log(`${urls.length} produtos no sitemap`);

  const products = [];
  for (const url of urls) {
    const slug = url.split('/').pop();
    const html = await get(url, `prod/${slug}.html`);
    products.push(parseProduct(html, url));
    process.stdout.write('.');
  }
  console.log();

  await downloadImages(products);

  const categories = [];
  for (const p of products) {
    if (p.category && !categories.some((c) => c.slug === p.category.slug)) categories.push(p.category);
  }

  const catalog = {
    scrapedAt: new Date().toISOString().slice(0, 10),
    source: ORIGIN,
    categories,
    products: products.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
  };

  await fs.mkdir('src/data', { recursive: true });
  await fs.writeFile('src/data/catalog.json', `${JSON.stringify(catalog, null, 2)}\n`);

  console.log(`\nprodutos: ${products.length}`);
  console.log(`categorias: ${categories.length}`);
  console.log(`sem preço: ${products.filter((p) => !p.price).length}`);
  console.log(`sem imagem: ${products.filter((p) => !p.localImages?.length).length}`);
  console.log(`sem descrição: ${products.filter((p) => !p.description.length).map((p) => p.slug).join(', ') || '0'}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
