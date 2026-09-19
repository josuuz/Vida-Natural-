import Link from 'next/link';
import { BeeMark } from './BeeMark';

type LogoProps = {
  /** `dark` = tinta escura sobre creme, `light` = creme sobre verde. */
  tone?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
  href?: string | null;
  className?: string;
};

const sizes = {
  sm: { mark: 'h-7 w-7', name: 'text-[1.05rem]', sub: 'text-[0.5rem]' },
  md: { mark: 'h-9 w-9 sm:h-10 sm:w-10', name: 'text-xl sm:text-[1.4rem]', sub: 'text-[0.55rem]' },
  lg: { mark: 'h-12 w-12', name: 'text-3xl', sub: 'text-[0.62rem]' },
};

export function Logo({ tone = 'dark', size = 'md', href = '/', className = '' }: LogoProps) {
  const s = sizes[size];
  const content = (
    <span
      className={`group inline-flex items-center gap-2.5 ${
        tone === 'light' ? 'text-cream-100' : 'text-forest-700'
      } ${className}`}
    >
      <BeeMark className={`${s.mark} shrink-0 transition-transform duration-500 group-hover:-rotate-6`} />
      <span className="flex flex-col leading-none">
        <span className={`font-display ${s.name} whitespace-nowrap tracking-[-0.02em]`}>Vida Natural</span>
        <span
          className={`eyebrow mt-1 whitespace-nowrap ${s.sub} ${
            tone === 'light' ? 'text-honey-300' : 'text-honey-700'
          } opacity-90`}
        >
          Produtos Naturais
        </span>
      </span>
    </span>
  );

  if (!href) return content;

  return (
    <Link href={href} aria-label="Vida Natural — página inicial" className="inline-flex">
      {content}
    </Link>
  );
}
