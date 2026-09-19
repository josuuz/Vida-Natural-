/**
 * Gera versões com fundo transparente (.webp) das fotos oficiais dos produtos,
 * para que as embalagens possam "flutuar" sobre os fundos creme do site.
 *
 * O fundo original é branco liso: um flood fill a partir das bordas remove o
 * branco e a sombra suave, com uma borda semitransparente para não serrilhar.
 *
 *   node scripts/make-cutouts.mjs
 */
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import sharp from 'sharp';

const CATALOG = 'src/data/catalog.json';
// O fundo original é branco com uma sombra suave por baixo. O limiar precisa
// ser baixo o bastante para comer a sombra (senão sobra um halo cinza nos
// blocos escuros) e a guarda de saturação impede que partes claras porém
// coloridas do produto sejam apagadas.
const HARD = 196; // luminância a partir da qual o pixel é considerado fundo
const SOFT = 214; // luminância em que a borda fica totalmente transparente
const MAX_SAT = 0.09; // acima disso o pixel tem cor demais para ser fundo

async function cutout(inFile, outFile) {
  const { data, info } = await sharp(inFile).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: ch } = info;
  const bg = new Uint8Array(w * h);
  const stack = [];
  const at = (x, y) => (y * w + x) * ch;
  const lum = (i) => 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  const sat = (i) => {
    const max = Math.max(data[i], data[i + 1], data[i + 2]);
    return max === 0 ? 0 : (max - Math.min(data[i], data[i + 1], data[i + 2])) / max;
  };

  for (let x = 0; x < w; x++) stack.push(x, 0, x, h - 1);
  for (let y = 0; y < h; y++) stack.push(0, y, w - 1, y);

  while (stack.length) {
    const y = stack.pop();
    const x = stack.pop();
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    const p = y * w + x;
    const i = at(x, y);
    if (bg[p] || lum(i) < HARD || sat(i) > MAX_SAT) continue;
    bg[p] = 1;
    stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
  }

  const alpha = new Uint8Array(w * h).fill(255);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      if (bg[p]) {
        alpha[p] = 0;
        continue;
      }
      const touchesBg =
        (x > 0 && bg[p - 1]) || (x < w - 1 && bg[p + 1]) || (y > 0 && bg[p - w]) || (y < h - 1 && bg[p + w]);
      if (!touchesBg) continue;
      const l = lum(at(x, y));
      if (l >= SOFT) alpha[p] = 0;
      else if (l > HARD) alpha[p] = Math.round(255 * (1 - (l - HARD) / (SOFT - HARD)));
    }
  }
  for (let p = 0; p < w * h; p++) data[p * ch + 3] = alpha[p];

  // corta o excesso de transparência para a embalagem ocupar todo o quadro
  await sharp(data, { raw: { width: w, height: h, channels: ch } })
    .trim({ threshold: 1 })
    .resize(1100, 1100, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 90, alphaQuality: 90, effort: 5 })
    .toFile(outFile);
}

const catalog = JSON.parse(await fs.readFile(CATALOG, 'utf8'));
let made = 0;
for (const product of catalog.products) {
  const source = product.localImages?.[0];
  if (!source) continue;
  const out = `public/produtos/${product.slug}-cutout.webp`;
  if (!existsSync(out)) {
    await cutout(`public${source.src}`, out);
    made += 1;
  }
  const meta = await sharp(out).metadata();
  product.cutout = { src: `/produtos/${product.slug}-cutout.webp`, width: meta.width, height: meta.height };
}
await fs.writeFile(CATALOG, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`cutouts gerados: ${made} / ${catalog.products.length}`);
