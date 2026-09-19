import 'server-only';
import { applyPaymentUpdate, getOrderByToken } from './orders';
import { getPayment, isMercadoPagoConfigured } from './payments/mercadopago';

/**
 * Resolve o pedido de uma página de retorno do gateway.
 *
 * O status que vem na URL não é levado em conta: quando há `payment_id`,
 * consultamos a API do Mercado Pago com o token do servidor e aplicamos o que
 * ela responder. A URL só nos diz QUAL pagamento conferir.
 */
export async function resolveCallbackOrder(params: {
  pedido?: string;
  payment_id?: string;
  collection_id?: string;
}) {
  const token = params.pedido;
  if (!token) return null;

  const paymentId = params.payment_id ?? params.collection_id;
  if (paymentId && isMercadoPagoConfigured()) {
    const payment = await getPayment(paymentId);
    if (payment?.orderId) {
      await applyPaymentUpdate({
        orderId: payment.orderId,
        paymentStatus: payment.status,
        paymentMethod: payment.method,
        gatewayPaymentId: payment.id,
        source: 'callback',
      });
    }
  }

  return getOrderByToken(token);
}
