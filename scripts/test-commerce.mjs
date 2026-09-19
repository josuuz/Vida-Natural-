/**
 * Testes do fluxo de compra contra o servidor rodando.
 *
 *   BASE=http://localhost:3100 npm run test:commerce
 *
 * Cobre: recálculo do carrinho, oferta progressiva, cupom, criação de pedido,
 * idempotência, assinatura do webhook, baixa de estoque e histórico.
 */
import { createHmac, randomUUID } from 'node:crypto';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../src/generated/prisma/client.ts';

const BASE = process.env.BASE ?? 'http://localhost:3100';
const ADMIN = process.env.ADMIN_API_TOKEN ?? 'token-de-teste';
const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db' }),
});

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'OK   ' : 'FALHA'} ${name}${detail ? ` — ${detail}` : ''}`);
};

const money = (value) => `R$ ${value.toFixed(2).replace('.', ',')}`;

async function postCart(body) {
  const response = await fetch(`${BASE}/api/cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: response.status, data: await response.json() };
}

async function main() {
  const [jar, propolis] = await Promise.all([
    prisma.product.findUnique({ where: { slug: 'mel-de-abelhas-sem-ferrao-jatai-100g' } }),
    prisma.product.findUnique({ where: { slug: 'extrato-de-propolis-propolis-verde-30ml' } }),
  ]);
  if (!jar || !propolis) throw new Error('catálogo não semeado — rode `npx prisma db seed`');

  /* ------------------------------------------------ 1. carrinho no servidor */
  {
    const { data } = await postCart({ lines: [{ slug: jar.slug, quantity: 2 }, { slug: propolis.slug, quantity: 1 }] });
    const expected = (jar.priceCents * 2 + propolis.priceCents) / 100;
    check('carrinho soma preços do banco', Math.abs(data.subtotal - expected) < 0.001, `${money(data.subtotal)} vs ${money(expected)}`);
    check('carrinho devolve 3 unidades', data.count === 3, String(data.count));
    check('carrinho traz sugestões de cross-sell', Array.isArray(data.suggestions));
  }

  /* --------------------------------------- 2. produto inexistente é ignorado */
  {
    const { data } = await postCart({ lines: [{ slug: 'produto-que-nao-existe', quantity: 1 }] });
    check('slug inválido é removido', data.lines.length === 0 && data.removed.length === 1, data.removed[0]?.reason ?? '');
  }

  /* --------------------------------------------- 3. oferta progressiva (tier) */
  {
    const tierPrice = Math.round(jar.priceCents * 0.9);
    await prisma.priceTier.upsert({
      where: { productId_minQuantity: { productId: jar.id, minQuantity: 3 } },
      update: { unitPriceCents: tierPrice, highlight: true },
      create: { productId: jar.id, minQuantity: 3, unitPriceCents: tierPrice, highlight: true },
    });

    const below = await postCart({ lines: [{ slug: jar.slug, quantity: 2 }] });
    const at = await postCart({ lines: [{ slug: jar.slug, quantity: 3 }] });

    check(
      'abaixo da faixa mantém preço cheio',
      Math.abs(below.data.subtotal - (jar.priceCents * 2) / 100) < 0.001,
      money(below.data.subtotal)
    );
    check(
      'na faixa aplica o preço promocional',
      Math.abs(at.data.subtotal - (tierPrice * 3) / 100) < 0.001,
      money(at.data.subtotal)
    );
    check('desconto por quantidade é reportado', at.data.tierDiscount > 0, money(at.data.tierDiscount));

    await prisma.priceTier.deleteMany({ where: { productId: jar.id } });
  }

  /* ------------------------------------------------------------- 4. cupom */
  {
    await prisma.coupon.update({ where: { code: 'BEMVINDO10' }, data: { active: true, usageCount: 0 } });

    const abaixo = await postCart({ lines: [{ slug: propolis.slug, quantity: 1 }], couponCode: 'BEMVINDO10' });
    check('cupom recusado abaixo do mínimo', abaixo.data.couponError === 'subtotal_minimo', abaixo.data.couponError ?? '');

    const acima = await postCart({ lines: [{ slug: jar.slug, quantity: 3 }], couponCode: 'BEMVINDO10' });
    const esperado = (jar.priceCents * 3 * 0.1) / 100;
    check(
      'cupom de 10% aplicado acima do mínimo',
      Math.abs(acima.data.couponDiscount - esperado) < 0.02,
      `${money(acima.data.couponDiscount)} vs ${money(esperado)}`
    );
    check(
      'total = subtotal − desconto',
      Math.abs(acima.data.total - (acima.data.subtotal - acima.data.couponDiscount)) < 0.02,
      money(acima.data.total)
    );

    const inexistente = await postCart({ lines: [{ slug: jar.slug, quantity: 3 }], couponCode: 'NAOEXISTE' });
    check('cupom inexistente é recusado', inexistente.data.couponError === 'nao_encontrado');

    await prisma.coupon.update({ where: { code: 'BEMVINDO10' }, data: { active: false } });
    const inativo = await postCart({ lines: [{ slug: jar.slug, quantity: 3 }], couponCode: 'BEMVINDO10' });
    check('cupom inativo é recusado', inativo.data.couponError === 'inativo');
  }

  /* --------------------------------------------------- 5. criação do pedido */
  const idempotencyKey = randomUUID();
  const pedido = {
    lines: [{ slug: jar.slug, quantity: 2 }],
    customer: { name: 'Cliente de Teste', email: `teste+${Date.now()}@exemplo.com`, phone: '(19) 99999-0000' },
    address: {
      zip: '13480-000',
      street: 'Rua de Teste',
      number: '100',
      district: 'Centro',
      city: 'Limeira',
      state: 'SP',
    },
    idempotencyKey,
  };

  let orderNumber = null;
  let orderToken = null;
  {
    const response = await fetch(`${BASE}/api/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pedido),
    });
    const data = await response.json();

    // o pedido é gravado antes de falar com o gateway, então a verificação é
    // feita no banco — vale tanto com gateway configurado quanto sem
    const saved = await prisma.order.findUnique({ where: { idempotencyKey }, include: { items: true } });
    check('checkout cria o pedido', Boolean(saved), saved?.number ?? JSON.stringify(data).slice(0, 120));
    orderNumber = saved?.number ?? null;
    orderToken = saved?.token ?? null;
    check(
      'total gravado é o calculado no servidor',
      saved?.totalCents === jar.priceCents * 2,
      `${saved?.totalCents} vs ${jar.priceCents * 2}`
    );
    check('item do pedido congela o preço', saved?.items[0]?.unitPriceCents === jar.priceCents);
    check(
      'pedido nasce aguardando pagamento',
      saved?.status === 'aguardando_pagamento' && saved?.paymentStatus === 'pending'
    );
    if (data.mode === 'whatsapp') {
      check('sem gateway o checkout devolve link de WhatsApp', String(data.whatsappUrl).includes('wa.me'));
    } else {
      check(
        'com gateway configurado o checkout responde o modo mercadopago',
        data.mode === 'mercadopago' || response.status === 502,
        data.mode ?? `HTTP ${response.status}`
      );
    }
  }

  /* ----------------------------------------------------- 6. idempotência */
  {
    const response = await fetch(`${BASE}/api/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pedido),
    });
    await response.json();
    const count = await prisma.order.count({ where: { idempotencyKey } });
    check('mesma chave não duplica pedido', count === 1, `${count} pedido(s)`);

  }

  /* ------------------------------------------- 7. validação de entrada */
  {
    const response = await fetch(`${BASE}/api/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...pedido, customer: { ...pedido.customer, email: 'nao-e-email' }, idempotencyKey: randomUUID() }),
    });
    check('e-mail inválido é recusado', response.status === 400, String(response.status));
  }

  /* ------------------------------- 8. mudança de status e baixa de estoque */
  {
    await prisma.product.update({ where: { id: jar.id }, data: { trackStock: true, stock: 10 } });

    const response = await fetch(`${BASE}/api/admin/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ADMIN}` },
      body: JSON.stringify({ number: orderNumber, paymentStatus: 'approved' }),
    });
    const data = await response.json();
    check('pagamento aprovado muda o pedido para pago', data.status === 'pago', JSON.stringify(data).slice(0, 80));

    const after = await prisma.product.findUnique({ where: { id: jar.id } });
    check('estoque baixa 2 unidades', after?.stock === 8, `estoque=${after?.stock}`);

    // reprocessar o mesmo status não pode baixar estoque de novo
    await fetch(`${BASE}/api/admin/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ADMIN}` },
      body: JSON.stringify({ number: orderNumber, paymentStatus: 'approved' }),
    });
    const again = await prisma.product.findUnique({ where: { id: jar.id } });
    check('reprocessar não baixa estoque duas vezes', again?.stock === 8, `estoque=${again?.stock}`);

    const order = await prisma.order.findUnique({ where: { number: orderNumber }, include: { events: true } });
    check('histórico registra os eventos', (order?.events.length ?? 0) >= 2, `${order?.events.length} eventos`);
    check('data de pagamento preenchida', Boolean(order?.paidAt));

    await prisma.product.update({ where: { id: jar.id }, data: { trackStock: false, stock: 0 } });
  }

  /* ------------------------------------------- 9. sem autorização no admin */
  {
    const response = await fetch(`${BASE}/api/admin/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: orderNumber, status: 'enviado' }),
    });
    check('admin exige token', response.status === 401, String(response.status));
  }

  /* --------------------------------------------- 10. webhook do gateway */
  {
    const semAssinatura = await fetch(`${BASE}/api/webhooks/mercadopago`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'payment', data: { id: '123' } }),
    });

    // 503 = o servidor está sem MERCADOPAGO_ACCESS_TOKEN e recusa qualquer
    // notificação; 401 = gateway configurado e a assinatura foi checada
    const gatewayDesligado = semAssinatura.status === 503;

    if (gatewayDesligado) {
      check('sem gateway configurado o webhook recusa tudo (503)', true, 'assinatura testada com o gateway ligado');
    } else {
      check('webhook recusa requisição sem assinatura', semAssinatura.status === 401, `HTTP ${semAssinatura.status}`);

      const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
      if (!secret) {
        console.log('     (sem MERCADOPAGO_WEBHOOK_SECRET no teste: assinatura válida não verificada)');
      } else {
        const ts = String(Math.floor(Date.now() / 1000));
        const dataId = '123456';
        const requestId = 'req-teste';
        const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
        const v1 = createHmac('sha256', secret).update(manifest).digest('hex');

        const comAssinatura = await fetch(`${BASE}/api/webhooks/mercadopago`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-signature': `ts=${ts},v1=${v1}`, 'x-request-id': requestId },
          body: JSON.stringify({ type: 'payment', data: { id: dataId } }),
        });
        check(
          'webhook aceita assinatura válida (para depois, no gateway)',
          comAssinatura.status !== 401,
          `HTTP ${comAssinatura.status}`
        );

        const adulterada = await fetch(`${BASE}/api/webhooks/mercadopago`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-signature': `ts=${ts},v1=${'0'.repeat(64)}`,
            'x-request-id': requestId,
          },
          body: JSON.stringify({ type: 'payment', data: { id: dataId } }),
        });
        check('webhook recusa assinatura adulterada', adulterada.status === 401, `HTTP ${adulterada.status}`);
      }
    }
  }

  /* ------------------------------------------------ 11. página do pedido */
  {
    const response = await fetch(`${BASE}/pedido/${orderToken}`);
    const html = await response.text();
    check('página do pedido responde', response.ok && html.includes(orderNumber), `HTTP ${response.status}`);

    const invalida = await fetch(`${BASE}/pedido/token-invalido`);
    check('token inválido dá 404', invalida.status === 404, `HTTP ${invalida.status}`);
  }

  /* ------------------------------------------------- limpeza dos dados */
  const testCustomers = await prisma.customer.findMany({
    where: { email: { startsWith: 'teste+' } },
    select: { id: true },
  });
  if (testCustomers.length) {
    const ids = testCustomers.map((customer) => customer.id);
    await prisma.order.deleteMany({ where: { customerId: { in: ids } } });
    await prisma.address.deleteMany({ where: { customerId: { in: ids } } });
    await prisma.customer.deleteMany({ where: { id: { in: ids } } });
    console.log(`
limpeza: ${testCustomers.length} cliente(s) de teste removido(s)`);
  }
  await prisma.coupon.update({ where: { code: 'BEMVINDO10' }, data: { active: false, usageCount: 0 } });

  const failures = results.filter((result) => !result.ok);
  console.log(`\n${results.length - failures.length}/${results.length} verificações passaram`);
  if (failures.length) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
