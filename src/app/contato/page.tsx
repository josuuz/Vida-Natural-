import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/layout/PageHero';
import { Reveal } from '@/components/ui/Reveal';
import { ButtonLink } from '@/components/ui/Button';
import { site, whatsappLink } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Contato',
  description: `Fale com a Vida Natural pelo WhatsApp ${site.contact.whatsapp}, pelo telefone ${site.contact.phone} ou pelo e-mail ${site.contact.email}.`,
  alternates: { canonical: '/contato' },
};

const channels = [
  {
    label: 'WhatsApp',
    value: site.contact.whatsapp,
    href: whatsappLink('Olá! Vim pelo site da Vida Natural.'),
    hint: 'A forma mais rápida de falar com a nossa equipe.',
    icon: (
      <path
        d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    ),
  },
  {
    label: 'Telefone',
    value: site.contact.phone,
    href: site.contact.phoneHref,
    hint: 'Atendimento de segunda a sexta.',
    icon: (
      <path
        d="M6.5 4h3l1.5 4-2 1.5a10 10 0 0 0 5.5 5.5L16 13l4 1.5v3a2 2 0 0 1-2.2 2C10.6 19 5 13.4 4.5 6.2A2 2 0 0 1 6.5 4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    ),
  },
  {
    label: 'E-mail',
    value: site.contact.email,
    href: `mailto:${site.contact.email}`,
    hint: 'Pedidos, trocas, devoluções e notas fiscais.',
    icon: (
      <>
        <rect x="3.5" y="5.5" width="17" height="13" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="m4 7 8 5.5L20 7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </>
    ),
  },
];

export default function ContatoPage() {
  return (
    <>
      <PageHero
        eyebrow="Fale com a fábrica"
        title={
          <>
            Estamos aqui para <span className="italic text-honey-700">ajudar</span>
          </>
        }
        description="Tire dúvidas sobre floradas, espécies de abelhas, prazos de entrega, pedidos em maior quantidade ou terceirização."
        crumbs={[{ label: 'Contato' }]}
      />

      <section className="container-page pb-20">
        <div className="grid gap-4 sm:grid-cols-3">
          {channels.map((channel, index) => (
            <Reveal key={channel.label} delay={index * 0.08}>
              <a
                href={channel.href}
                target={channel.href.startsWith('http') ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="group flex h-full flex-col rounded-lg border border-line bg-cream-100 p-7 transition-all duration-500 hover:-translate-y-1 hover:border-forest-700/30 hover:bg-cream-200"
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-honey-700" aria-hidden>
                  {channel.icon}
                </svg>
                <p className="eyebrow mt-6 text-ink-muted">{channel.label}</p>
                <p className="mt-2 break-words font-display text-[1.15rem] leading-tight text-forest-900 transition-colors group-hover:text-honey-700 lg:text-[1.35rem]">
                  {channel.value}
                </p>
                <p className="mt-4 text-[0.85rem] leading-relaxed text-ink-muted">{channel.hint}</p>
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="container-page pb-24">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <div className="honeycomb-light rounded-xl bg-forest-800 p-8 text-cream-100 sm:p-10">
              <h2 className="text-[1.6rem] leading-tight sm:text-[2rem]">A loja da fábrica</h2>
              <p className="mt-5 text-[0.95rem] leading-relaxed text-cream-200/75">{site.inspection}</p>
              <dl className="mt-8 flex flex-col gap-4 text-[0.9rem]">
                <div>
                  <dt className="text-[0.7rem] uppercase tracking-[0.14em] text-honey-300">Razão social</dt>
                  <dd className="mt-1 text-cream-200/85">{site.legalName}</dd>
                </div>
                <div>
                  <dt className="text-[0.7rem] uppercase tracking-[0.14em] text-honey-300">CNPJ</dt>
                  <dd className="mt-1 text-cream-200/85">{site.cnpj}</dd>
                </div>
                <div>
                  <dt className="text-[0.7rem] uppercase tracking-[0.14em] text-honey-300">Instagram</dt>
                  <dd className="mt-1">
                    <a
                      href={site.social.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cream-200/85 link-underline"
                    >
                      {site.social.instagramHandle}
                    </a>
                  </dd>
                </div>
              </dl>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="flex h-full flex-col justify-center">
              <h2 className="text-[1.6rem] leading-tight text-forest-900 sm:text-[2rem]">Antes de escrever</h2>
              <p className="mt-5 text-[0.95rem] leading-relaxed text-ink-muted">
                Boa parte das dúvidas sobre prazos, formas de pagamento, trocas e devoluções já está respondida nas
                nossas páginas institucionais.
              </p>
              <ul className="mt-7 flex flex-col divide-y divide-line border-y border-line">
                {[
                  { label: 'Meios de pagamento e frete', href: '/politicas/pagamento-e-frete' },
                  { label: 'Trocas e devoluções', href: '/politicas/trocas-e-devolucoes' },
                  { label: 'Política de privacidade', href: '/politicas/privacidade' },
                ].map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="group flex items-center justify-between gap-4 py-4 text-[0.95rem] text-forest-800 transition-colors hover:text-honey-700"
                    >
                      {item.label}
                      <svg viewBox="0 0 20 20" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden>
                        <path d="M4 10h11M11 5.5 15.5 10 11 14.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Link>
                  </li>
                ))}
              </ul>
              <ButtonLink href={whatsappLink('Olá! Vim pelo site da Vida Natural.')} className="mt-9" size="lg">
                Chamar no WhatsApp
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
