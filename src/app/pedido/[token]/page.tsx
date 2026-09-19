import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getOrderByToken } from '@/server/orders';
import { OrderDetail } from '@/components/checkout/OrderDetail';

export const metadata: Metadata = {
  title: 'Seu pedido',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ novo?: string }>;
}) {
  const { token } = await params;
  const { novo } = await searchParams;
  const order = await getOrderByToken(token);
  if (!order) notFound();

  return <OrderDetail order={order} justCreated={novo === '1'} />;
}
