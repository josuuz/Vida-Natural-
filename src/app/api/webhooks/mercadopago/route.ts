import { NextResponse } from 'next/server';
import { applyPaymentUpdate } from '@/server/orders';
import { getPayment, isMercadoPagoConfigured, verifyWebhookSignature } from '@/server/payments/mercadopago';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Webhook do Mercado Pago.
 *
 * Nunca acreditamos no corpo da notificação: ele só diz QUAL pagamento mudou.
 * O status real é buscado na API com o token do servidor, e a assinatura do
 * cabeçalho é verificada antes de qualquer coisa.
 */
export async function POST(request: Request) {
  if (!isMercadoPagoConfigured()) {
    return NextResponse.json({ error: 'gateway não configurado' }, { status: 503 });
  }

  const url = new URL(request.url);
  let body: { type?: string; action?: string; data?: { id?: string } } = {};
  try {
    body = await request.json();
  } catch {
    // o Mercado Pago também notifica via querystring
  }

  const dataId = body.data?.id ?? url.searchParams.get('data.id') ?? url.searchParams.get('id');
  const topic = body.type ?? url.searchParams.get('type') ?? url.searchParams.get('topic');

  const signature = verifyWebhookSignature({
    signature: request.headers.get('x-signature'),
    requestId: request.headers.get('x-request-id'),
    dataId: dataId ?? null,
  });

  if (!signature.valid) {
    console.warn('[webhook mercadopago] assinatura recusada:', signature.reason);
    return NextResponse.json({ error: 'assinatura inválida' }, { status: 401 });
  }

  // só pagamentos interessam; outros tópicos são confirmados e ignorados
  if (topic && topic !== 'payment') return NextResponse.json({ ok: true, ignored: topic });
  if (!dataId) return NextResponse.json({ ok: true, ignored: 'sem id' });

  const payment = await getPayment(dataId);
  if (!payment) return NextResponse.json({ error: 'pagamento não encontrado' }, { status: 404 });
  if (!payment.orderId) return NextResponse.json({ ok: true, ignored: 'sem external_reference' });

  const order = await applyPaymentUpdate({
    orderId: payment.orderId,
    paymentStatus: payment.status,
    paymentMethod: payment.method,
    gatewayPaymentId: payment.id,
    source: 'webhook',
  });

  if (!order) return NextResponse.json({ error: 'pedido não encontrado' }, { status: 404 });

  return NextResponse.json({ ok: true, order: order.number, status: order.status });
}

/** O painel do Mercado Pago faz um GET para testar a URL. */
export async function GET() {
  return NextResponse.json({ ok: true });
}
