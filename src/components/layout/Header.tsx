'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { Logo } from '@/components/brand/Logo';
import { navigation, site } from '@/lib/site';
import { useCart } from '@/components/cart/CartProvider';
import { SearchOverlay } from './SearchOverlay';
import type { CategorySummary } from '@/lib/types';

function IconButton({
  label,
  onClick,
  href,
  children,
  badge,
}: {
  label: string;
  onClick?: () => void;
  href?: string;
  children: React.ReactNode;
  badge?: number;
}) {
  const className =
    'relative grid h-10 w-10 place-items-center rounded-full text-forest-800 transition-all duration-300 hover:bg-cream-200 hover:text-honey-700';

  const content = (
    <>
      {children}
      {badge && badge > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-honey-500 px-1 text-[0.62rem] font-semibold tabular-nums text-forest-950">
          {badge > 99 ? '99+' : badge}
        </span>
      ) : null}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className={className}
        aria-label={label}
        title={label}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel="noopener noreferrer"
      >
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className} aria-label={label} title={label}>
      {content}
    </button>
  );
}

export function Header({ categories }: { categories: CategorySummary[] }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { scrollY } = useScroll();
  const { count, open: openCart } = useCart();
  const pathname = usePathname();

  useMotionValueEvent(scrollY, 'change', (value) => setScrolled(value > 24));

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  return (
    <>
      {/* faixa institucional */}
      <div className="relative z-40 bg-forest-900 text-cream-200">
        <div className="container-page flex h-9 items-center justify-between gap-4 text-[0.68rem] tracking-[0.06em] sm:text-[0.72rem]">
          <p className="truncate">
            <span className="text-honey-300">●</span> <span className="sm:hidden">Inspecionada pelo MAPA</span>
            <span className="hidden sm:inline">Loja da fábrica inspecionada pelo MAPA</span>
          </p>
          <a
            href={site.contact.phoneHref}
            className="hidden shrink-0 transition-colors hover:text-honey-300 sm:block"
          >
            {site.contact.phone}
          </a>
          <a
            href={`https://wa.me/${site.contact.whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 transition-colors hover:text-honey-300"
          >
            WhatsApp {site.contact.whatsapp}
          </a>
        </div>
      </div>

      <header
        className={`sticky top-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          scrolled
            ? 'border-b border-line/80 bg-cream-50/92 backdrop-blur-md supports-[backdrop-filter]:bg-cream-50/75'
            : 'border-b border-transparent bg-cream-50'
        }`}
      >
        <div
          className={`container-page flex items-center justify-between gap-4 transition-all duration-500 ${
            scrolled ? 'h-16' : 'h-[4.75rem] sm:h-20'
          }`}
        >
          <Logo size={scrolled ? 'sm' : 'md'} />

          <nav aria-label="Navegação principal" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {navigation.map((item) => {
                const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <li key={item.label} className="group relative">
                    <Link
                      href={item.href}
                      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-2 text-[0.8rem] transition-colors duration-300 xl:px-3.5 xl:text-[0.86rem] ${
                        active ? 'text-honey-700' : 'text-forest-800 hover:text-honey-700'
                      }`}
                    >
                      {item.label}
                      {item.children ? (
                        <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 opacity-50 transition-transform duration-300 group-hover:rotate-180" aria-hidden>
                          <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : null}
                    </Link>

                    {item.children ? (
                      <div className="pointer-events-none absolute left-1/2 top-full z-50 w-72 -translate-x-1/2 pt-3 opacity-0 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
                        <div className="translate-y-2 rounded-lg border border-line bg-cream-50 p-2 shadow-lift transition-transform duration-300 group-hover:translate-y-0 group-focus-within:translate-y-0">
                          {item.children.map((child) => (
                            <Link
                              key={`${child.label}-${child.href}`}
                              href={child.href}
                              className="flex items-baseline justify-between gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-cream-200"
                            >
                              <span className="text-[0.88rem] text-forest-800">{child.label}</span>
                              {child.hint ? (
                                <span className="shrink-0 text-[0.68rem] uppercase tracking-[0.12em] text-honey-700">
                                  {child.hint}
                                </span>
                              ) : null}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-0.5 sm:gap-1">
            <IconButton label="Buscar produtos" onClick={() => setSearchOpen(true)}>
              <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" aria-hidden>
                <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="1.6" />
                <path d="m13.5 13.5 3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </IconButton>

            <IconButton label="Meus pedidos" href="/pedidos">
              <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" aria-hidden>
                <circle cx="10" cy="7" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
                <path d="M4 16.5c1.2-2.8 3.4-4.2 6-4.2s4.8 1.4 6 4.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </IconButton>

            <IconButton label="Abrir carrinho" onClick={openCart} badge={count}>
              <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" aria-hidden>
                <path d="M4.5 6.5h11l-1.1 9.1a1.4 1.4 0 0 1-1.4 1.2H7a1.4 1.4 0 0 1-1.4-1.2z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="M7.4 8.2V6a2.6 2.6 0 0 1 5.2 0v2.2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </IconButton>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="ml-0.5 grid h-10 w-10 place-items-center rounded-full text-forest-800 transition-colors hover:bg-cream-200 lg:hidden"
              aria-label="Abrir menu"
              aria-expanded={menuOpen}
            >
              <span className="flex w-[18px] flex-col gap-[5px]">
                <span className="h-px w-full bg-current" />
                <span className="h-px w-full bg-current" />
                <span className="h-px w-[70%] bg-current" />
              </span>
            </button>
          </div>
        </div>
      </header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} categories={categories} />

      <AnimatePresence>
        {menuOpen ? (
          <div className="fixed inset-0 z-[75] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
            <motion.button
              type="button"
              aria-label="Fechar menu"
              onClick={() => setMenuOpen(false)}
              className="absolute inset-0 h-full w-full cursor-default bg-forest-950/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            />
            <motion.nav
              className="honeycomb-light absolute inset-y-0 right-0 flex w-[min(22rem,88vw)] flex-col overflow-y-auto bg-forest-900 px-7 py-7"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 280, damping: 34 }}
              aria-label="Navegação"
            >
              <div className="flex items-center justify-between">
                <Logo tone="light" size="sm" />
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="grid h-10 w-10 place-items-center rounded-full border border-cream-200/25 text-cream-100 transition-colors hover:bg-cream-100/10"
                  aria-label="Fechar menu"
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
                    <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <ul className="mt-10 flex flex-col gap-1">
                {navigation.map((item, index) => (
                  <motion.li
                    key={item.label}
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.06 + index * 0.045, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="border-b border-cream-200/10 py-1"
                  >
                    <Link
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className="block py-2.5 font-display text-2xl text-cream-100 transition-colors hover:text-honey-300"
                    >
                      {item.label}
                    </Link>
                    {item.children && item.label === 'Produtos' ? (
                      <div className="flex flex-wrap gap-1.5 pb-3">
                        {item.children.slice(1).map((child) => (
                          <Link
                            key={`${child.label}-${child.href}`}
                            href={child.href}
                            onClick={() => setMenuOpen(false)}
                            className="rounded-full border border-cream-200/20 px-3 py-1 text-[0.72rem] text-cream-200/80 transition-colors hover:border-honey-300 hover:text-honey-300"
                          >
                            {child.hint && child.hint !== 'Catálogo completo' ? `${child.label} · ${child.hint}` : child.label}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </motion.li>
                ))}
              </ul>

              <div className="mt-auto pt-10 text-sm text-cream-200/70">
                <p className="eyebrow mb-3 text-honey-300">Fale com a gente</p>
                <a href={site.contact.phoneHref} className="block py-1 transition-colors hover:text-cream-100">
                  {site.contact.phone}
                </a>
                <a
                  href={`https://wa.me/${site.contact.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block py-1 transition-colors hover:text-cream-100"
                >
                  WhatsApp {site.contact.whatsapp}
                </a>
                <a href={`mailto:${site.contact.email}`} className="block py-1 transition-colors hover:text-cream-100">
                  {site.contact.email}
                </a>
              </div>
            </motion.nav>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
