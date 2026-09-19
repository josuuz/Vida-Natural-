/**
 * Testes de interação da interface (Playwright).
 * Carrinho, busca, filtros, abas de espécies e menu mobile.
 *
 *   node scripts/test-ui.mjs
 */
import { chromium } from 'playwright';
const B = 'http://localhost:3100';
const results = [];
const check = (name, ok, extra = '') => results.push(`${ok ? 'OK   ' : 'FALHA'} ${name}${extra ? ' — ' + extra : ''}`);
const browser = await chromium.launch();

try {
  // ---------- carrinho
  let page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', (e) => results.push('JS ERROR: ' + String(e).slice(0, 120)));
  await page.goto(`${B}/produtos/mel-de-abelhas-sem-ferrao-jatai-100g`, { waitUntil: 'networkidle' });
  await page.click('[aria-label="Aumentar quantidade"]');
  await page.locator('button', { hasText: /^Adicionar — R\$/ }).first().click();
  await page.waitForTimeout(900);
  check('carrinho abre ao adicionar', await page.locator('aside:has-text("Seu carrinho")').isVisible());
  const total = await page.locator('[data-testid="cart-total"]').textContent();
  check('total 2x R$65,19 = R$130,38 (calculado no servidor)', /130,38/.test(total ?? ''), total ?? '');
  const checkoutHref = await page.locator('aside a:has-text("Finalizar compra")').getAttribute('href');
  check('drawer leva ao checkout', checkoutHref === '/checkout', checkoutHref ?? '');
  check('drawer sugere produtos complementares', (await page.locator('aside:has-text("Leve também")').count()) > 0);

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const badge = (await page.locator('[aria-label="Abrir carrinho"] span').first().textContent())?.trim();
  check('carrinho persiste no reload', badge === '2', `badge=${badge}`);

  // ---------- busca
  await page.click('[aria-label="Buscar produtos"]');
  await page.waitForTimeout(600);
  await page.fill('input[aria-label="Buscar produtos"]', 'urucu');
  await page.waitForTimeout(600);
  const hits = await page.locator('[role="dialog"] a[href*="/produtos/"]').count();
  check('busca ignora acento ("urucu")', hits >= 3, `${hits} resultados`);
  await page.keyboard.press('Escape');
  await page.close();

  // ---------- filtros
  page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${B}/produtos`, { waitUntil: 'networkidle' });
  await page.locator('aside label').filter({ hasText: 'Méis em Sachês' }).first().click();
  await page.waitForTimeout(700);
  const filtered = await page.locator('article').count();
  check('filtro de categoria', filtered === 3, `${filtered} cards`);
  await page.selectOption('select', 'menor-preco');
  await page.waitForTimeout(600);
  const first = await page.locator('article').first().textContent();
  check('ordenar por menor preço', (first ?? '').includes('18,99'), (first ?? '').replace(/\s+/g, ' ').slice(0, 60));
  await page.fill('input[aria-label="Buscar produtos"]', 'zzz');
  await page.waitForTimeout(600);
  check('estado vazio', await page.getByText('Nenhum produto com esses filtros').isVisible());
  await page.close();

  // ---------- abas de espécies nativas
  page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(B, { waitUntil: 'networkidle' });
  const tabs = page.locator('[role="tab"]');
  const tabCount = await tabs.count();
  check('seção de nativas lista as 10 espécies em abas', tabCount === 10, `${tabCount} abas`);

  const primeiro = await page.locator('#especie-painel h3').textContent();
  await tabs.nth(4).click();
  await page.waitForTimeout(700);
  const depois = await page.locator('#especie-painel h3').textContent();
  check('clicar na aba troca a espécie', primeiro !== depois, `${primeiro?.trim()} → ${depois?.trim()}`);

  await tabs.nth(4).focus();
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(600);
  const comTeclado = await page.locator('#especie-painel h3').textContent();
  check('setas do teclado navegam entre espécies', comTeclado !== depois, `${depois?.trim()} → ${comTeclado?.trim()}`);

  const alturaSecao = await page.evaluate(() => {
    const section = Array.from(document.querySelectorAll('section')).find((s) => s.textContent?.includes('Cada abelha nativa'));
    return Math.round(section.getBoundingClientRect().height);
  });
  check('seção cabe em ~1 tela (antes eram 5)', alturaSecao < 1200, `${alturaSecao}px`);
  await page.close();

  // ---------- mobile
  page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(B, { waitUntil: 'networkidle' });
  await page.click('[aria-label="Abrir menu"]');
  await page.waitForTimeout(700);
  check('menu mobile abre', await page.locator('nav[aria-label="Navegação"]').isVisible());
  await page.locator('nav[aria-label="Navegação"] a').filter({ hasText: /^Produtos$/ }).first().click();
  await page.waitForTimeout(1200);
  check('navegação pelo menu', page.url().includes('/produtos'), page.url());
  await page.click('button:has-text("Filtros")');
  await page.waitForTimeout(700);
  check('drawer de filtros mobile', await page.getByRole('dialog', { name: 'Filtros' }).isVisible());
  await page.close();
} catch (err) {
  results.push('ERRO NO TESTE: ' + String(err).split('\n')[0]);
}

await browser.close();
console.log(results.join('\n'));
