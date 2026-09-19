/**
 * Faixa de diferenciais. Todos os itens são informações publicadas pela própria
 * Vida Natural nas páginas "Quem somos" e no rodapé do site.
 */
const items = [
  {
    label: 'Loja da fábrica',
    detail: 'Produção e envase próprios',
    icon: (
      <path
        d="M4 20V10l6-4 6 4v10M9 20v-5h2v5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    label: 'Inspecionada pelo MAPA',
    detail: 'Ministério da Agricultura',
    icon: (
      <path
        d="M12 3.5 19 6v6c0 4-3 7-7 8.5C8 19 5 16 5 12V6z M9 12l2 2 4-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    label: 'Laboratório próprio',
    detail: '13 Programas de Auto Controle',
    icon: (
      <path
        d="M10 3.5v6L5.5 18a2 2 0 0 0 1.8 2.9h9.4A2 2 0 0 0 18.5 18L14 9.5v-6M9 3.5h6M8 14h8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    label: '+500 produtos registrados',
    detail: 'Portfólio homologado no MAPA',
    icon: (
      <path
        d="M6 4h9l4 4v12H6zM15 4v4h4M9 13h7M9 16.5h5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
];

export function TrustStrip() {
  return (
    <section className="honeycomb-light relative bg-forest-800 text-cream-100" aria-label="Diferenciais da Vida Natural">
      <div className="container-page grid grid-cols-2 gap-x-6 gap-y-8 py-9 sm:py-10 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="flex items-start gap-3.5">
            <svg viewBox="0 0 24 24" className="mt-0.5 h-6 w-6 shrink-0 text-honey-300" aria-hidden>
              {item.icon}
            </svg>
            <div className="min-w-0">
              <p className="text-[0.88rem] leading-snug">{item.label}</p>
              <p className="mt-1 text-[0.72rem] leading-snug text-cream-200/55">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
