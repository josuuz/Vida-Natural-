import type { ProductSummary } from '@/lib/types';
import { ProductCard } from './ProductCard';

type ProductGridProps = {
  products: ProductSummary[];
  /** Colunas no desktop — 3 dá cards bem grandes, 4 é o padrão da loja. */
  columns?: 3 | 4;
  priorityCount?: number;
  className?: string;
};

export function ProductGrid({ products, columns = 4, priorityCount = 0, className = '' }: ProductGridProps) {
  const cols = columns === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4';

  return (
    <div className={`grid grid-cols-2 gap-x-5 gap-y-12 sm:gap-x-7 md:grid-cols-3 ${cols} ${className}`}>
      {products.map((product, index) => (
        <ProductCard key={product.slug} product={product} index={index} priority={index < priorityCount} />
      ))}
    </div>
  );
}
