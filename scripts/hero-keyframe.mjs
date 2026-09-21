/**
 * Captura a placa de fundo do hero mobile — o trecho da seção atrás dos potes,
 * sem os produtos — que serve de quadro inicial (e final, quando o modelo
 * aceitar) do loop de luz ambiente gerado no Higgsfield
 * (ver .claude/agents/higgsfield-hero.md).
 *
 * Os produtos ficam de fora de propósito: vídeo de IA redesenha o texto dos
 * rótulos. Na página, as fotos reais entram por cima do loop.
 *
 *   npm run dev -- -p 3100   (em outro terminal)
 *   node scripts/hero-keyframe.mjs [saida.png]
 */
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:3100';
const OUT = process.argv[2] ?? path.join(os.tmpdir(), 'vida-natural-hero-plate.png');
const WIDTH = 390;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: WIDTH, height: 844 }, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(2500); // fim das entradas animadas

const clip = await page.evaluate((width) => {
  const stage = document.querySelector('[data-hero-stage]');
  if (!stage) throw new Error('composição do hero ([data-hero-stage]) não encontrada');
  // produtos, selo, loop atual e texturas finas ficam fora da placa
  stage.querySelectorAll('[data-hero-layers], [data-hero-badge], video').forEach((el) => (el.style.visibility = 'hidden'));
  document.querySelectorAll('.texture-grain, .texture-wax, nextjs-portal').forEach((el) => (el.style.display = 'none'));
  // botão do WhatsApp, indicador do next dev e afins não podem entrar no quadro
  document.querySelectorAll('body *').forEach((el) => {
    if (getComputedStyle(el).position === 'fixed') el.style.display = 'none';
  });
  // a camada ambiente cobre a largura toda da tela, na altura do palco
  const r = stage.getBoundingClientRect();
  return { x: 0, y: r.top + window.scrollY, width, height: Math.round(r.height) };
}, WIDTH);

await page.screenshot({ path: OUT, clip, fullPage: true });
await browser.close();
console.log(`placa salva em ${OUT} (${clip.width * 2}×${clip.height * 2})`);
