/**
 * Varredura responsiva: procura overflow horizontal, imagem quebrada e erro de
 * JavaScript em cada página, nos cinco tamanhos de tela de referência.
 *
 *   node scripts/test-responsivo.mjs [larguras]
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:3100';
const pages = [
  { path: '/', name: 'home' },
  { path: '/produtos', name: 'produtos' },
  { path: '/produtos/mel-de-abelhas-sem-ferrao-urucu-nordestina-100g', name: 'produto' },
  { path: '/categoria/meis-de-abelhas-apis-mellifera', name: 'categoria' },
  { path: '/sobre', name: 'sobre' },
  { path: '/contato', name: 'contato' },
  { path: '/politicas/pagamento-e-frete', name: 'politica' },
  { path: '/checkout', name: 'checkout' },
  { path: '/pedidos', name: 'pedidos' },
  { path: '/pagina-inexistente', name: '404' },
];
const viewports = (process.argv[2] ?? '375,430,768,1024,1440').split(',').map(Number);

const browser = await chromium.launch();
const problems = [];
for (const vp of viewports) {
  for (const p of pages) {
    const page = await browser.newPage({ viewport: { width: vp, height: Math.round(vp * 0.68) + 400 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 160)));
    const bad = [];
    page.on('response', (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url().replace(BASE, '').slice(0, 80)}`); });

    await page.goto(BASE + p.path, { waitUntil: 'networkidle', timeout: 90000 });
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.7;
      for (let y = 0; y < document.body.scrollHeight; y += step) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 90)); }
      window.scrollTo(0, 0); await new Promise((r) => setTimeout(r, 350));
    });

    const report = await page.evaluate(() => {
      const docW = document.documentElement.scrollWidth;
      const vw = window.innerWidth;
      const overflowers = [];
      if (docW > vw + 1) {
        document.querySelectorAll('body *').forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && (r.right > vw + 1 || r.left < -1) && getComputedStyle(el).position !== 'fixed') {
            const style = getComputedStyle(el);
            if (style.overflow === 'hidden' || style.overflowX === 'hidden') return;
            overflowers.push(`${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ').slice(0, 2).join('.')} → ${Math.round(r.left)}..${Math.round(r.right)}`);
          }
        });
      }
      const brokenImgs = Array.from(document.querySelectorAll('img')).filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc || i.src);
      return { docW, vw, overflowers: overflowers.slice(0, 5), brokenImgs: brokenImgs.slice(0, 4), imgCount: document.querySelectorAll('img').length };
    });

    const issues = [];
    if (report.docW > report.vw + 1) issues.push(`overflow ${report.docW}>${report.vw} :: ${report.overflowers.join(' | ')}`);
    if (report.brokenImgs.length) issues.push(`imgs quebradas: ${report.brokenImgs.join(', ')}`);
    if (bad.length) issues.push(`http: ${bad.slice(0, 3).join(', ')}`);
    if (errors.length) issues.push(`js: ${errors.slice(0, 2).join(' | ')}`);
    if (issues.length) problems.push(`[${vp}px ${p.name}] ${issues.join(' ;; ')}`);

    if (vp === 1440 || vp === 375) await page.screenshot({ path: `scripts/.shots/${p.name}-${vp}.png`, fullPage: true });
    await page.close();
  }
  console.log(`✓ ${vp}px`);
}
await browser.close();
console.log(problems.length ? '\nPROBLEMAS:\n' + problems.join('\n') : '\nNenhum problema de overflow/imagem/JS encontrado.');
