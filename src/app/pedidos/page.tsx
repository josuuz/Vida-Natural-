import type { Metadata } from 'next';
import { PageHero } from '@/components/layout/PageHero';
import { OrderLookup } from '@/components/checkout/OrderLookup';

export const metadata: Metadata = {
  title: 'Acompanhar pedido',
  description: 'Consulte o andamento do seu pedido na Vida Natural com o e-mail e o número do pedido.',
};

export default function PedidosPage() {
  return (
    <>
      <PageHero
        eyebrow="Meus pedidos"
        title={
          <>
            Acompanhe o seu <span className="italic text-honey-700">pedido</span>
          </>
        }
        description="Informe o e-mail usado na compra e o número do pedido (ele aparece na confirmação, no formato VN-000123)."
        crumbs={[{ label: 'Meus pedidos' }]}
      />
      <OrderLookup />
    </>
  );
}
