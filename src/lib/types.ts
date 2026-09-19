/**
 * DTOs trafegados entre servidor e cliente.
 *
 * Regra: o banco guarda dinheiro em centavos; tudo que sai daqui já está em
 * reais (number) para a UI formatar. Nenhum componente calcula preço final —
 * isso é sempre feito no servidor.
 */

export type ImageRef = { src: string; width: number; height: number };

export type DescriptionBlock = {
  kind: 'heading' | 'feature' | 'paragraph';
  emoji: string | null;
  label?: string;
  text: string;
};

/** Faixa de oferta progressiva ("3 unidades por R$ X cada"). */
export type PriceTier = {
  minQuantity: number;
  unitPrice: number;
  /** Total pago levando exatamente `minQuantity` unidades. */
  total: number;
  /** Economia em reais frente ao preço unitário cheio. */
  savings: number;
  highlight: boolean;
  label: string | null;
};

export type ProductBadge = {
  kind: 'mais-vendido' | 'destaque' | 'novidade' | 'oferta' | 'estoque-limitado';
  label: string;
};

export type ProductSummary = {
  id: string;
  slug: string;
  /** Nome oficial completo. */
  name: string;
  /** Linha mostrada acima do título. */
  line: string;
  /** Título curto para vitrines. */
  title: string;
  variant: string | null;
  categorySlug: string;
  categoryName: string;
  size: string | null;
  price: number;
  /** Preço de referência anterior, quando existir de verdade. */
  compareAtPrice: number | null;
  /** Percentual inteiro de desconto; null quando não há promoção. */
  discountPercent: number | null;
  /** Economia em reais frente ao `compareAtPrice`. */
  savings: number | null;
  installments: { count: number; value: number } | null;
  image: ImageRef;
  available: boolean;
  /** Só é `true` quando a loja controla estoque e ele está baixo de verdade. */
  lowStock: boolean;
  stock: number | null;
  badges: ProductBadge[];
  tiers: PriceTier[];
};

export type ProductDetail = ProductSummary & {
  sku: string | null;
  description: DescriptionBlock[];
  metaDescription: string | null;
  gallery: ImageRef[];
  infoImages: ImageRef[];
  weightGrams: number;
};

export type CategorySummary = {
  slug: string;
  name: string;
  label: string;
  tagline: string;
  family: 'sem-ferrao' | 'meis' | 'propolis' | 'outros';
  count: number;
};

export type Species = {
  name: string;
  scientific: string;
  epithet: string;
  product: ProductSummary;
};

export type KitSummary = {
  slug: string;
  name: string;
  description: string;
  price: number | null;
  /** Soma dos itens avulsos, para mostrar a economia do kit. */
  itemsTotal: number;
  savings: number | null;
  items: { product: ProductSummary; quantity: number }[];
};

/* ------------------------------------------------------------------ carrinho */

export type CartLineInput = { slug: string; quantity: number };

export type CartLine = {
  product: ProductSummary;
  quantity: number;
  /** Preço unitário efetivamente aplicado (já considera oferta progressiva). */
  unitPrice: number;
  /** Preço cheio, quando o unitário veio de uma faixa promocional. */
  compareAtUnitPrice: number | null;
  total: number;
  /** Faixa de oferta progressiva aplicada, se houver. */
  appliedTier: PriceTier | null;
  /** Próxima faixa disponível, para o incentivo "leve mais X e pague menos". */
  nextTier: PriceTier | null;
};

export type ShippingOption = {
  id: string;
  label: string;
  price: number;
  days: number;
};

export type CartSummary = {
  lines: CartLine[];
  /** Itens removidos por terem saído do catálogo ou do estoque. */
  removed: { slug: string; reason: string }[];
  count: number;
  subtotal: number;
  /** Desconto vindo de ofertas progressivas. */
  tierDiscount: number;
  coupon: AppliedCoupon | null;
  couponDiscount: number;
  discount: number;
  shipping: number | null;
  shippingOptions: ShippingOption[];
  selectedShipping: ShippingOption | null;
  freeShipping: {
    enabled: boolean;
    threshold: number;
    missing: number;
    reached: boolean;
  } | null;
  total: number;
  weightGrams: number;
  /** Recomendações complementares, já sem o que está no carrinho. */
  suggestions: ProductSummary[];
};

export type AppliedCoupon = {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  description: string | null;
};

export type CouponError =
  | 'nao_encontrado'
  | 'inativo'
  | 'expirado'
  | 'nao_iniciado'
  | 'limite_atingido'
  | 'subtotal_minimo';

/* -------------------------------------------------------------------- pedido */

export type OrderStatus =
  | 'aguardando_pagamento'
  | 'pago'
  | 'em_separacao'
  | 'enviado'
  | 'entregue'
  | 'cancelado';

export type PaymentStatus = 'pending' | 'approved' | 'in_process' | 'rejected' | 'cancelled' | 'refunded';

export type OrderSummary = {
  number: string;
  token: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string | null;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  couponCode: string | null;
  shippingLabel: string | null;
  createdAt: string;
  paidAt: string | null;
  customer: { name: string; email: string };
  address: {
    zip: string;
    street: string;
    number: string;
    complement: string | null;
    district: string;
    city: string;
    state: string;
  } | null;
  items: {
    slug: string;
    name: string;
    image: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  events: { status: string; note: string | null; createdAt: string }[];
};
