import { formatInstallments, formatPrice } from '@/lib/format';
import type { ProductSummary } from '@/lib/types';

type Props = {
  product: Pick<ProductSummary, 'price' | 'compareAtPrice' | 'discountPercent' | 'savings' | 'installments'>;
  size?: 'sm' | 'md' | 'lg';
  /** Mostra a linha "economize R$ X" abaixo do preço. */
  showSavings?: boolean;
  className?: string;
};

const sizes = {
  sm: { price: 'text-[1.3rem]', compare: 'text-[0.8rem]', note: 'text-[0.78rem]' },
  md: { price: 'text-[1.6rem]', compare: 'text-[0.9rem]', note: 'text-[0.85rem]' },
  lg: { price: 'text-[2.4rem]', compare: 'text-[1rem]', note: 'text-[0.9rem]' },
};

/**
 * Bloco de preço.
 *
 * O preço anterior só aparece quando existe `compareAtPrice` cadastrado — não
 * há preço de referência inventado para simular desconto.
 */
export function PriceTag({ product, size = 'md', showSavings = false, className = '' }: Props) {
  const s = sizes[size];
  const installments = formatInstallments(product.installments);
  const onSale = product.compareAtPrice !== null && product.discountPercent !== null;

  return (
    <div className={className}>
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        {onSale ? (
          <span className={`${s.compare} text-ink-muted line-through`}>{formatPrice(product.compareAtPrice)}</span>
        ) : null}
        <span className={`font-display ${s.price} leading-none tabular-nums text-forest-900`}>
          {formatPrice(product.price)}
        </span>
        {onSale ? (
          <span className="rounded-full bg-honey-500 px-2 py-0.5 text-[0.68rem] font-semibold tabular-nums text-forest-950">
            {product.discountPercent}% OFF
          </span>
        ) : null}
      </div>

      {onSale && showSavings && product.savings ? (
        <p className={`mt-1.5 ${s.note} font-medium text-honey-700`}>
          Você economiza {formatPrice(product.savings)}
        </p>
      ) : null}

      {installments ? <p className={`mt-1 ${s.note} text-ink-muted`}>ou {installments} sem juros</p> : null}
    </div>
  );
}
