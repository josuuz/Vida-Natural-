'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { formatSize } from '@/lib/format';
import { ProductGrid } from '@/components/product/ProductGrid';
import type { CategorySummary, ProductSummary } from '@/lib/types';

type SortKey = 'relevancia' | 'menor-preco' | 'maior-preco' | 'a-z';

const sortOptions: { key: SortKey; label: string }[] = [
  { key: 'relevancia', label: 'Mais relevantes' },
  { key: 'menor-preco', label: 'Menor preço' },
  { key: 'maior-preco', label: 'Maior preço' },
  { key: 'a-z', label: 'A–Z' },
];

const normalize = (value: string) =>
  value.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');

/** Filtra sobre os produtos já entregues pelo servidor. */
function searchProducts(list: ProductSummary[], term: string) {
  const query = normalize(term.trim());
  if (!query) return list;
  const words = query.split(/\s+/);
  return list.filter((product) => {
    const haystack = normalize([product.name, product.title, product.line, product.categoryName].join(' '));
    return words.every((word) => haystack.includes(word));
  });
}

function sortProducts(list: ProductSummary[], key: SortKey) {
  const sorted = [...list];
  switch (key) {
    case 'menor-preco':
      return sorted.sort((a, b) => a.price - b.price);
    case 'maior-preco':
      return sorted.sort((a, b) => b.price - a.price);
    case 'a-z':
      return sorted.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
    default:
      return sorted;
  }
}

const priceRanges = [
  { key: 'ate-25', label: 'Até R$ 25', test: (value: number) => value <= 25 },
  { key: '25-50', label: 'R$ 25 a R$ 50', test: (value: number) => value > 25 && value <= 50 },
  { key: '50-80', label: 'R$ 50 a R$ 80', test: (value: number) => value > 50 && value <= 80 },
  { key: 'acima-80', label: `Acima de R$ 80`, test: (value: number) => value > 80 },
];

const familyLabels: Record<string, string> = {
  'sem-ferrao': 'Abelhas sem ferrão',
  meis: 'Méis',
  propolis: 'Própolis',
  outros: 'Outros',
};

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

type FiltersProps = {
  categories: CategorySummary[];
  sizeOptions: string[];
  priceBounds: { min: number; max: number };
  selectedCategories: string[];
  selectedSizes: string[];
  selectedPrices: string[];
  onCategory: (slug: string) => void;
  onSize: (size: string) => void;
  onPrice: (key: string) => void;
  onClear: () => void;
  hasFilters: boolean;
};

function FilterPanel({
  categories,
  sizeOptions,
  priceBounds,
  selectedCategories,
  selectedSizes,
  selectedPrices,
  onCategory,
  onSize,
  onPrice,
  onClear,
  hasFilters,
}: FiltersProps) {
  const families = Array.from(new Set(categories.map((category) => category.family)));

  return (
    <div className="flex flex-col gap-9">
      <div>
        <div className="flex items-baseline justify-between">
          <h2 className="eyebrow text-honey-700">Categorias</h2>
          {hasFilters ? (
            <button
              type="button"
              onClick={onClear}
              className="text-[0.72rem] text-ink-muted underline-offset-2 transition-colors hover:text-honey-700 hover:underline"
            >
              limpar tudo
            </button>
          ) : null}
        </div>

        <div className="mt-5 flex flex-col gap-6">
          {families.map((family) => (
            <div key={family}>
              <p className="mb-2.5 text-[0.7rem] uppercase tracking-[0.14em] text-ink-muted/70">
                {familyLabels[family] ?? family}
              </p>
              <ul className="flex flex-col gap-1.5">
                {categories
                  .filter((category) => category.family === family)
                  .map((category) => {
                    const checked = selectedCategories.includes(category.slug);
                    return (
                      <li key={category.slug}>
                        <label className="group flex cursor-pointer items-start gap-2.5 py-1">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => onCategory(category.slug)}
                            className="sr-only"
                          />
                          <span
                            className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-[4px] border transition-colors duration-200 ${
                              checked ? 'border-forest-700 bg-forest-700' : 'border-line bg-cream-50 group-hover:border-forest-500'
                            }`}
                            aria-hidden
                          >
                            {checked ? (
                              <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-cream-50">
                                <path d="m2.5 6.2 2.2 2.2 4.8-4.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            ) : null}
                          </span>
                          <span className="text-[0.88rem] leading-snug text-ink-soft transition-colors group-hover:text-forest-800">
                            {category.label}
                            {category.tagline ? (
                              <span className="block text-[0.72rem] text-ink-muted">{category.tagline}</span>
                            ) : null}
                          </span>
                          <span className="ml-auto pt-0.5 text-[0.72rem] tabular-nums text-ink-muted">{category.count}</span>
                        </label>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="eyebrow mb-4 text-honey-700">Peso e volume</h2>
        <div className="flex flex-wrap gap-2">
          {sizeOptions.map((size) => {
            const checked = selectedSizes.includes(size);
            return (
              <button
                key={size}
                type="button"
                onClick={() => onSize(size)}
                aria-pressed={checked}
                className={`rounded-full border px-3.5 py-1.5 text-[0.78rem] transition-all duration-300 ${
                  checked
                    ? 'border-forest-700 bg-forest-700 text-cream-50'
                    : 'border-line bg-cream-50 text-ink-soft hover:border-forest-500'
                }`}
              >
                {formatSize(size)}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="eyebrow mb-4 text-honey-700">Faixa de preço</h2>
        <div className="flex flex-col gap-2">
          {priceRanges.map((range) => {
            const checked = selectedPrices.includes(range.key);
            return (
              <button
                key={range.key}
                type="button"
                onClick={() => onPrice(range.key)}
                aria-pressed={checked}
                className={`rounded-md border px-3.5 py-2 text-left text-[0.82rem] transition-all duration-300 ${
                  checked
                    ? 'border-forest-700 bg-forest-700 text-cream-50'
                    : 'border-line bg-cream-50 text-ink-soft hover:border-forest-500'
                }`}
              >
                {range.label}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[0.72rem] text-ink-muted">
          Catálogo de R$ {priceBounds.min} a R$ {priceBounds.max}.
        </p>
      </div>
    </div>
  );
}

export function ShopClient({
  products,
  categories,
}: {
  products: ProductSummary[];
  categories: CategorySummary[];
}) {
  const params = useSearchParams();

  const sizeOptions = useMemo(
    () =>
      Array.from(new Set(products.map((product) => product.size).filter((size): size is string => Boolean(size)))).sort(
        (a, b) => {
          const value = (size: string) => parseFloat(size.replace(',', '.'));
          const unit = (size: string) => (size.endsWith('ml') || size.endsWith('l') ? 1 : 0);
          return unit(a) - unit(b) || value(a) - value(b);
        }
      ),
    [products]
  );

  const priceBounds = useMemo(
    () => ({
      min: Math.floor(Math.min(...products.map((product) => product.price))),
      max: Math.ceil(Math.max(...products.map((product) => product.price))),
    }),
    [products]
  );
  const [term, setTerm] = useState(params.get('busca') ?? '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    const fromUrl = params.get('categoria');
    return fromUrl ? fromUrl.split(',').filter((slug) => categories.some((category) => category.slug === slug)) : [];
  });
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>('relevancia');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const hasFilters =
    selectedCategories.length > 0 || selectedSizes.length > 0 || selectedPrices.length > 0 || term.trim() !== '';

  const results: ProductSummary[] = useMemo(() => {
    let list = products;
    if (selectedCategories.length) list = list.filter((product) => selectedCategories.includes(product.categorySlug));
    if (selectedSizes.length) list = list.filter((product) => product.size && selectedSizes.includes(product.size));
    if (selectedPrices.length) {
      list = list.filter((product) =>
        selectedPrices.some((key) => priceRanges.find((range) => range.key === key)?.test(product.price ?? 0))
      );
    }
    list = searchProducts(list, term);
    return sortProducts(list, sort);
  }, [products, selectedCategories, selectedSizes, selectedPrices, term, sort]);

  const clear = () => {
    setSelectedCategories([]);
    setSelectedSizes([]);
    setSelectedPrices([]);
    setTerm('');
  };

  const filterProps: FiltersProps = {
    categories,
    sizeOptions,
    priceBounds,
    selectedCategories,
    selectedSizes,
    selectedPrices,
    onCategory: (slug) => setSelectedCategories((current) => toggle(current, slug)),
    onSize: (size) => setSelectedSizes((current) => toggle(current, size)),
    onPrice: (key) => setSelectedPrices((current) => toggle(current, key)),
    onClear: clear,
    hasFilters,
  };

  return (
    <div className="container-page pb-24">
      <div className="grid gap-10 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-14">
        {/* filtros — desktop */}
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <FilterPanel {...filterProps} />
          </div>
        </aside>

        <div>
          {/* barra de busca e ordenação */}
          <div className="sticky top-[4.25rem] z-30 -mx-4 mb-8 flex flex-col gap-3 border-b border-line bg-cream-50/92 px-4 py-4 backdrop-blur-md sm:-mx-8 sm:px-8 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <svg viewBox="0 0 20 20" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden>
                  <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  <path d="m13.5 13.5 3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                <input
                  type="search"
                  value={term}
                  onChange={(event) => setTerm(event.target.value)}
                  placeholder="Buscar no catálogo"
                  aria-label="Buscar produtos"
                  className="h-11 w-full rounded-full border border-line bg-cream-50 pl-11 pr-4 text-[0.88rem] text-forest-900 outline-none transition-colors placeholder:text-ink-muted/70 focus:border-forest-500"
                />
              </div>

              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-line px-4 text-[0.85rem] text-forest-800 transition-colors hover:border-forest-700 lg:hidden"
              >
                Filtros
                {hasFilters ? <span className="h-1.5 w-1.5 rounded-full bg-honey-500" aria-hidden /> : null}
              </button>

              <label className="hidden items-center gap-2 sm:flex">
                <span className="sr-only">Ordenar por</span>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SortKey)}
                  className="h-11 rounded-full border border-line bg-cream-50 px-4 text-[0.85rem] text-forest-800 outline-none transition-colors hover:border-forest-500 focus:border-forest-500"
                >
                  {sortOptions.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-[0.8rem] text-ink-muted">
                {results.length} {results.length === 1 ? 'produto' : 'produtos'}
                {hasFilters ? ' encontrados' : ' no catálogo'}
              </p>
              <label className="flex items-center gap-2 sm:hidden">
                <span className="sr-only">Ordenar por</span>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SortKey)}
                  className="h-9 rounded-full border border-line bg-cream-50 px-3 text-[0.78rem] text-forest-800 outline-none"
                >
                  {sortOptions.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {results.length === 0 ? (
            <div className="flex flex-col items-center gap-5 rounded-lg border border-dashed border-line py-20 text-center">
              <p className="font-display text-2xl text-forest-900">Nenhum produto com esses filtros</p>
              <p className="max-w-sm text-sm text-ink-muted">
                Tente remover algum filtro ou buscar por “mel”, “própolis” ou o nome de uma abelha nativa.
              </p>
              <button
                type="button"
                onClick={clear}
                className="rounded-full border border-forest-700/30 px-5 py-2.5 text-sm text-forest-800 transition-colors hover:bg-forest-700 hover:text-cream-50"
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <ProductGrid products={results} columns={3} priorityCount={3} />
          )}
        </div>
      </div>

      {/* filtros — mobile */}
      <AnimatePresence>
        {drawerOpen ? (
          <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Filtros">
            <motion.button
              type="button"
              aria-label="Fechar filtros"
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 h-full w-full cursor-default bg-forest-950/45"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-xl bg-cream-50 px-6 pb-8 pt-6"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 280, damping: 32 }}
            >
              <div className="mb-6 flex items-center justify-between">
                <p className="font-display text-xl text-forest-900">Filtros</p>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink-soft"
                  aria-label="Fechar filtros"
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
                    <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <FilterPanel {...filterProps} />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="mt-8 h-12 w-full rounded-full bg-forest-700 text-sm text-cream-50"
              >
                Ver {results.length} {results.length === 1 ? 'produto' : 'produtos'}
              </button>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
