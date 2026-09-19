import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { site } from '@/lib/site';
import { getCategories } from '@/server/catalog';

const institucional = [
  { label: 'Sobre a Vida Natural', href: '/sobre' },
  { label: 'Todos os produtos', href: '/produtos' },
  { label: 'Acompanhar pedido', href: '/pedidos' },
  { label: 'Contato', href: '/contato' },
  { label: 'Meios de pagamento e frete', href: '/politicas/pagamento-e-frete' },
  { label: 'Trocas e devoluções', href: '/politicas/trocas-e-devolucoes' },
  { label: 'Política de privacidade', href: '/politicas/privacidade' },
];

function PaymentBadge({ children }: { children: string }) {
  return (
    <span className="rounded-md border border-cream-200/20 px-3 py-1.5 text-[0.7rem] tracking-wide text-cream-200/80">
      {children}
    </span>
  );
}

export async function Footer() {
  const categories = await getCategories();
  return (
    <footer className="honeycomb-light relative mt-24 bg-forest-900 text-cream-200/75">
      {/* filete dourado */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-honey-500/60 to-transparent" />

      <div className="container-page py-16 sm:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.1fr] lg:gap-10">
          <div>
            <Logo tone="light" size="md" />
            <p className="mt-6 max-w-sm text-sm leading-relaxed">
              Méis de abelhas sem ferrão, méis florais, extratos de própolis e compostos naturais. Fábrica própria,
              há mais de 40 anos.
            </p>
            <p className="mt-5 max-w-sm text-[0.78rem] leading-relaxed text-cream-200/55">{site.inspection}</p>
            <a
              href={site.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2.5 rounded-full border border-cream-200/20 py-2 pl-2.5 pr-4 text-sm transition-colors hover:border-honey-300 hover:text-honey-300"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" />
              </svg>
              {site.social.instagramHandle}
            </a>
          </div>

          <nav aria-labelledby="footer-categorias">
            <h2 id="footer-categorias" className="eyebrow mb-5 text-honey-300">
              Categorias
            </h2>
            <ul className="flex flex-col gap-2.5 text-sm">
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/categoria/${category.slug}`}
                    className="transition-colors duration-300 hover:text-honey-300"
                  >
                    {category.label}
                    {category.tagline ? (
                      <span className="block text-[0.72rem] text-cream-200/45">{category.tagline}</span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-institucional">
            <h2 id="footer-institucional" className="eyebrow mb-5 text-honey-300">
              Institucional
            </h2>
            <ul className="flex flex-col gap-2.5 text-sm">
              {institucional.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="transition-colors duration-300 hover:text-honey-300">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="eyebrow mb-5 text-honey-300">Contato</h2>
            <ul className="flex flex-col gap-3 text-sm">
              <li>
                <a href={site.contact.phoneHref} className="transition-colors hover:text-honey-300">
                  Telefone {site.contact.phone}
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${site.contact.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 transition-colors hover:text-honey-300"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                    <path
                      d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9 8.4c.3-.6.6-.6.9-.6h.6c.2 0 .5 0 .7.5l.7 1.6c.1.3 0 .5-.1.7l-.4.5c-.1.2-.3.3-.1.6.2.4.8 1.2 1.6 1.8.9.7 1.4.9 1.7.8.2 0 .4-.3.6-.5l.4-.5c.2-.2.4-.2.7-.1l1.5.8c.3.2.4.4.4.6 0 .3-.1.9-.5 1.3-.4.4-1.1.7-1.8.7-1.1 0-2.9-.7-4.4-2.1-1.6-1.5-2.6-3.3-2.7-4.3-.1-.8.2-1.4.6-1.8z"
                      fill="currentColor"
                    />
                  </svg>
                  WhatsApp {site.contact.whatsapp}
                </a>
              </li>
              <li>
                <a href={`mailto:${site.contact.email}`} className="transition-colors hover:text-honey-300">
                  {site.contact.email}
                </a>
              </li>
            </ul>

            <h2 className="eyebrow mb-3 mt-8 text-honey-300">Formas de pagamento</h2>
            <div className="flex flex-wrap gap-2">
              {site.payments.map((payment) => (
                <PaymentBadge key={payment}>{payment}</PaymentBadge>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-cream-200/12 pt-7 text-[0.75rem] text-cream-200/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {site.legalName} — CNPJ: {site.cnpj}
          </p>
          <p>© {new Date().getFullYear()} Vida Natural. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
