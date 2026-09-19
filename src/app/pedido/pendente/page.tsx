import type { Metadata } from 'next';
import { OrderOutcome } from '@/components/checkout/OrderOutcome';
import { resolveCallbackOrder } from '@/server/checkout-callback';

export const metadata: Metadata = {
  title: 'Pedido',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ pedido?: string; payment_id?: string; collection_id?: string }>;
}) {
  const params = await searchParams;
  const order = await resolveCallbackOrder(params);

  return <OrderOutcome outcome="pendente" order={order} />;
}
