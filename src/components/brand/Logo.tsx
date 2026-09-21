import Image from 'next/image';
import Link from 'next/link';

type LogoProps = {
  /** `dark` = sobre fundo claro, `light` = sobre verde (a marca entra numa placa creme). */
  tone?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
  href?: string | null;
  className?: string;
};

const heights = {
  sm: 'h-10',
  md: 'h-11 sm:h-12',
  lg: 'h-14',
};

export function Logo({ tone = 'dark', size = 'md', href = '/', className = '' }: LogoProps) {
  const content = (
    <span
      className={`inline-flex items-center ${
        tone === 'light' ? 'rounded-md bg-cream-50 px-3 py-2 shadow-[0_1px_0_rgba(255,255,255,0.4)_inset]' : ''
      } ${className}`}
    >
      <Image
        src="/brand/vida-natural-logo.png"
        alt="Vida Natural — Produtos Naturais Ltda."
        width={499}
        height={164}
        priority={tone === 'dark'}
        sizes="180px"
        className={`${heights[size]} w-auto transition-[height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]`}
      />
    </span>
  );

  if (!href) return content;

  return (
    <Link
      href={href}
      aria-label="Vida Natural — página inicial"
      className="inline-flex rounded-md transition-opacity duration-300 hover:opacity-85"
    >
      {content}
    </Link>
  );
}
