/**
 * Constantes da marca.
 *
 * Todos os dados aqui vêm do site oficial vidanat.com.br (páginas "Quem somos",
 * "Meios de pagamento e de frete" e rodapé). Nada é inventado.
 */

export const site = {
  name: 'Vida Natural',
  legalName: 'VN Distribuidora de Alimentos Ltda',
  cnpj: '11.695.951/0001-49',
  url: 'https://www.vidanat.com.br',
  tagline: 'Produtos Naturais',
  description:
    'Méis de abelhas sem ferrão, méis florais, extratos de própolis e compostos naturais produzidos pela Vida Natural há mais de 40 anos. Loja da fábrica inspecionada pelo MAPA.',
  contact: {
    phone: '(19) 3877-2189',
    phoneHref: 'tel:+551938772189',
    whatsapp: '(19) 99961-2189',
    whatsappNumber: '5519999612189',
    email: 'vendas@vidanat.com.br',
  },
  social: {
    instagram: 'https://instagram.com/abelhastoreoficial',
    instagramHandle: '@abelhastoreoficial',
  },
  /** Texto literal do rodapé do site atual. */
  inspection:
    'Loja da Fábrica — Inspecionada pelo Ministério da Agricultura, Pecuária e Abastecimento (MAPA).',
  payments: ['Pix', 'Boleto bancário', 'Cartão de crédito'],
} as const;

/** Mensagem inicial usada nos links de WhatsApp. */
export function whatsappLink(message?: string) {
  const base = `https://wa.me/${site.contact.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export type NavItem = {
  label: string;
  href: string;
  children?: { label: string; href: string; hint?: string }[];
};

export const navigation: NavItem[] = [
  { label: 'Início', href: '/' },
  {
    label: 'Produtos',
    href: '/produtos',
    children: [
      { label: 'Todos os produtos', href: '/produtos', hint: 'Catálogo completo' },
      {
        label: 'Méis de Abelhas sem Ferrão',
        href: '/categoria/meis-de-abelhas-sem-ferrao-lancamentos',
        hint: 'Exclusivos',
      },
      { label: 'Méis de Abelhas sem Ferrão', href: '/categoria/meis-de-abelhas-sem-ferrao', hint: 'Raros' },
      { label: 'Méis', href: '/categoria/meis-de-abelhas-apis-mellifera', hint: 'Energia natural do campo' },
      { label: 'Méis em Sachês', href: '/categoria/meis-em-saches', hint: 'Praticidade diária' },
      { label: 'Extrato de Própolis', href: '/categoria/extrato-de-propolis', hint: 'Gotas de proteção' },
      {
        label: 'Composto de Mel e Extrato de Própolis',
        href: '/categoria/composto-de-mel-e-extrato-de-propolis',
        hint: 'Imunidade reforçada',
      },
      { label: 'Spray Bucal', href: '/categoria/spray-bucal', hint: 'Frescor imediato' },
      { label: 'Balas', href: '/categoria/balas', hint: 'Alívio rápido' },
      { label: 'Chá', href: '/categoria/cha', hint: 'Conforto natural' },
    ],
  },
  {
    label: 'Méis',
    href: '/categoria/meis-de-abelhas-apis-mellifera',
    children: [
      { label: 'Méis florais', href: '/categoria/meis-de-abelhas-apis-mellifera' },
      { label: 'Méis em sachês', href: '/categoria/meis-em-saches' },
    ],
  },
  {
    label: 'Própolis',
    href: '/categoria/extrato-de-propolis',
    children: [
      { label: 'Extratos de própolis', href: '/categoria/extrato-de-propolis' },
      { label: 'Compostos de mel e própolis', href: '/categoria/composto-de-mel-e-extrato-de-propolis' },
      { label: 'Sprays bucais', href: '/categoria/spray-bucal' },
      { label: 'Balas', href: '/categoria/balas' },
    ],
  },
  {
    label: 'Abelhas sem Ferrão',
    href: '/categoria/meis-de-abelhas-sem-ferrao-lancamentos',
    children: [
      { label: 'Exclusivos — 100g', href: '/categoria/meis-de-abelhas-sem-ferrao-lancamentos' },
      { label: 'Raros — 50g', href: '/categoria/meis-de-abelhas-sem-ferrao' },
    ],
  },
  { label: 'Sobre', href: '/sobre' },
  { label: 'Contato', href: '/contato' },
];

/**
 * Fatos institucionais — todos retirados da página "Quem somos" do site atual.
 */
export const brandFacts = {
  years: 'mais de 40 anos',
  founder: 'Edson de Rezende',
  registeredProducts: 'mais de 500 produtos registrados no MAPA',
  controlPrograms: '13 Programas de Auto Controle',
  inspection: 'fiscalização do SIF',
  lab: 'laboratório próprio',
} as const;
