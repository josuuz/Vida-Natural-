type TextureVariant = 'grain' | 'paper' | 'wax' | 'noise-dark';

const variants: Record<TextureVariant, string> = {
  /** grão de impressão sobre fundos claros */
  grain: 'texture-grain opacity-[0.045]',
  /** fibra de papel artesanal — seções creme */
  paper: 'texture-paper opacity-[0.055]',
  /** manchas largas de cera — profundidade sem desenho reconhecível */
  wax: 'texture-wax opacity-[0.05]',
  /** ruído clareando, para blocos verde-escuro */
  'noise-dark': 'texture-grain-light opacity-[0.07]',
};

/**
 * Camada de textura de uma seção. Fica sempre atrás do conteúdo e nunca
 * intercepta cliques; a intensidade é baixa de propósito — deve ser percebida
 * só quando se presta atenção.
 */
export function Texture({
  variant = 'grain',
  className = '',
}: {
  variant?: TextureVariant;
  className?: string;
}) {
  return <span aria-hidden className={`pointer-events-none absolute inset-0 ${variants[variant]} ${className}`} />;
}

/**
 * Mancha orgânica difusa — usada para dar ambiência a uma seção sem recorrer a
 * padrões repetidos.
 */
export function Blob({
  className = '',
  tone = 'honey',
}: {
  className?: string;
  tone?: 'honey' | 'forest' | 'cream';
}) {
  const tones = {
    honey: 'bg-honey-400/25',
    forest: 'bg-forest-500/10',
    cream: 'bg-cream-300/40',
  };
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute rounded-[42%_58%_54%_46%/48%_42%_58%_52%] blur-3xl ${tones[tone]} ${className}`}
    />
  );
}
