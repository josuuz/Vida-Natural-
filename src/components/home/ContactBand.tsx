import { site, whatsappLink } from '@/lib/site';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';

/**
 * Faixa de contato. Não há newsletter com backend neste site, então o convite
 * leva para os canais que a Vida Natural realmente usa: WhatsApp e e-mail.
 */
export function ContactBand() {
  return (
    <section className="container-page py-8 sm:py-10" aria-labelledby="contato-band-titulo">
      <Reveal>
        <div className="honeycomb relative overflow-hidden rounded-xl bg-honey-200 px-7 py-12 sm:px-12 sm:py-16">
          <span
            className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-honey-400/40 blur-3xl"
            aria-hidden
          />
          <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <span className="eyebrow text-honey-700">Atendimento direto</span>
              <h2 id="contato-band-titulo" className="mt-4 text-[clamp(1.8rem,4vw,2.75rem)] leading-[1.08] text-forest-900">
                Dúvida sobre um mel? <span className="italic">Fale com a fábrica.</span>
              </h2>
              <p className="mt-5 max-w-lg text-[0.97rem] leading-relaxed text-forest-800/75">
                Nossa equipe responde sobre floradas, espécies de abelhas, prazos, frete e pedidos em maior
                quantidade. Atendimento de segunda a sexta.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
              <ButtonLink
                href={whatsappLink('Olá! Vim pelo site da Vida Natural e gostaria de falar sobre os produtos.')}
                size="lg"
                className="justify-center"
              >
                WhatsApp {site.contact.whatsapp}
              </ButtonLink>
              <ButtonLink href={`mailto:${site.contact.email}`} variant="outline" size="lg" className="justify-center">
                {site.contact.email}
              </ButtonLink>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
