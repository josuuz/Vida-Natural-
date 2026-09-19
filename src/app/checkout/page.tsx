import type { Metadata } from 'next';
import { PageHero } from '@/components/layout/PageHero';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';

export const metadata: Metadata = {
  title: 'Finalizar pedido',
  description: 'Conclua seu pedido na Vida Natural com PIX, cartão de crédito ou boleto.',
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <>
      <PageHero
        eyebrow="Checkout"
        title="Finalizar pedido"
        description="Confira os itens, informe a entrega e escolha como quer pagar."
        crumbs={[{ label: 'Carrinho' }, { label: 'Checkout' }]}
        compact
      />
      <CheckoutForm />
    </>
  );
}
