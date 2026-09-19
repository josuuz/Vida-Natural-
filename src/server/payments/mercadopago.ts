import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { PaymentStatus } from '@/lib/types';

/**
 * Integração com o Mercado Pago (Checkout Pro).
 *
 * Aceita PIX, cartão de crédito e boleto na mesma preferência. O ACCESS_TOKEN é
 * secreto e só existe no servidor — nunca é enviado ao navegador.
 *
 * Nada aqui confia no retorno do navegador: o status real do pagamento é
 * sempre buscado na API com o token do servidor, a partir do webhook.
 */
const API = 'https://api.mercadopago.com';

export function isMercadoPagoConfigured() {
  return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);
}

function accessToken() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado');
  return token;
}

export type PreferenceItem = {
  id: string;
  title: string;
  quantity: number;
  unitPriceCents: number;
  pictureUrl?: string;
};

export type CreatePreferenceInput = {
  orderId: string;
  orderNumber: string;
  items: PreferenceItem[];
  shippingCents: number;
  discountCents: number;
  payer: { name: string; email: string; phone?: string | null; document?: string | null };
  backUrls: { success: string; pending: string; failure: string };
  notificationUrl: string;
};

/** Cria a preferência de pagamento e devolve o link do checkout. */
export async function createPreference(input: CreatePreferenceInput) {
  const items = input.items.map((item) => ({
    id: item.id,
    title: item.title.slice(0, 250),
    quantity: item.quantity,
    currency_id: 'BRL',
    unit_price: item.unitPriceCents / 100,
    picture_url: item.pictureUrl,
  }));

  // frete e desconto entram como itens próprios para o total bater exatamente
  if (input.shippingCents > 0) {
    items.push({
      id: 'frete',
      title: 'Frete',
      quantity: 1,
      currency_id: 'BRL',
      unit_price: input.shippingCents / 100,
      picture_url: undefined,
    });
  }

  const body = {
    external_reference: input.orderId,
    statement_descriptor: 'VIDANATURAL',
    items,
    payer: {
      name: input.payer.name,
      email: input.payer.email,
      ...(input.payer.document
        ? { identification: { type: input.payer.document.length > 11 ? 'CNPJ' : 'CPF', number: input.payer.document } }
        : {}),
    },
    back_urls: {
      success: input.backUrls.success,
      pending: input.backUrls.pending,
      failure: input.backUrls.failure,
    },
    auto_return: 'approved',
    notification_url: input.notificationUrl,
    metadata: { order_number: input.orderNumber },
    ...(input.discountCents > 0
      ? { coupon_amount: input.discountCents / 100 }
      : {}),
  };

  const response = await fetch(`${API}/checkout/preferences`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken()}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': input.orderId,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Mercado Pago recusou a preferência (${response.status}): ${detail.slice(0, 300)}`);
  }

  const data = (await response.json()) as { id: string; init_point: string; sandbox_init_point?: string };
  return {
    id: data.id,
    // em contas de teste o init_point público já aponta para o sandbox
    checkoutUrl: data.init_point ?? data.sandbox_init_point,
  };
}

/** Consulta o pagamento direto na API — fonte de verdade do status. */
export async function getPayment(paymentId: string) {
  const response = await fetch(`${API}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken()}` },
    cache: 'no-store',
  });
  if (!response.ok) return null;

  const data = (await response.json()) as {
    id: number;
    status: string;
    status_detail?: string;
    payment_method_id?: string;
    payment_type_id?: string;
    external_reference?: string;
    transaction_amount?: number;
  };

  return {
    id: String(data.id),
    status: mapStatus(data.status),
    rawStatus: data.status,
    method: data.payment_method_id ?? data.payment_type_id ?? null,
    orderId: data.external_reference ?? null,
    amount: data.transaction_amount ?? null,
  };
}

export function mapStatus(status: string): PaymentStatus {
  switch (status) {
    case 'approved':
    case 'authorized':
      return 'approved';
    case 'in_process':
    case 'in_mediation':
      return 'in_process';
    case 'rejected':
      return 'rejected';
    case 'cancelled':
      return 'cancelled';
    case 'refunded':
    case 'charged_back':
      return 'refunded';
    default:
      return 'pending';
  }
}

/**
 * Valida a assinatura do webhook conforme a documentação do Mercado Pago.
 *
 * O cabeçalho `x-signature` traz `ts` e `v1`; o manifesto assinado é
 * `id:<data.id>;request-id:<x-request-id>;ts:<ts>;` com HMAC-SHA256.
 */
export function verifyWebhookSignature(params: {
  signature: string | null;
  requestId: string | null;
  dataId: string | null;
}) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  // sem segredo configurado não há como validar: o webhook é recusado
  if (!secret) return { valid: false, reason: 'segredo_nao_configurado' as const };
  if (!params.signature || !params.dataId) return { valid: false, reason: 'assinatura_ausente' as const };

  const parts = Object.fromEntries(
    params.signature.split(',').map((piece) => {
      const [key, value] = piece.split('=');
      return [key?.trim(), value?.trim()];
    })
  ) as { ts?: string; v1?: string };

  if (!parts.ts || !parts.v1) return { valid: false, reason: 'assinatura_malformada' as const };

  const manifest = `id:${params.dataId.toLowerCase()};${
    params.requestId ? `request-id:${params.requestId};` : ''
  }ts:${parts.ts};`;
  const expected = createHmac('sha256', secret).update(manifest).digest('hex');

  const received = Buffer.from(parts.v1, 'utf8');
  const computed = Buffer.from(expected, 'utf8');
  const valid = received.length === computed.length && timingSafeEqual(received, computed);

  return valid ? { valid: true as const } : { valid: false as const, reason: 'assinatura_invalida' as const };
}
