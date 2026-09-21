import Link from 'next/link';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

type Variant = 'primary' | 'outline' | 'ghost' | 'honey' | 'light';
type Size = 'sm' | 'md' | 'lg';

const base =
  'group/btn inline-flex select-none items-center justify-center gap-2 rounded-full font-medium tracking-[0.01em] transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:translate-y-0 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50';

const variants: Record<Variant, string> = {
  primary:
    'bg-forest-700 text-cream-50 shadow-[0_1px_2px_rgba(20,33,26,0.2)] hover:bg-forest-800 hover:shadow-[0_10px_28px_-12px_rgba(20,33,26,0.65)] hover:-translate-y-0.5',
  outline:
    'border border-forest-700/35 text-forest-800 hover:border-forest-700 hover:bg-forest-700 hover:text-cream-50 hover:-translate-y-0.5',
  honey:
    'bg-honey-500 text-forest-950 hover:bg-honey-400 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-12px_rgba(181,128,31,0.8)]',
  light:
    'border border-cream-200/40 text-cream-100 hover:bg-cream-100 hover:text-forest-900 hover:-translate-y-0.5',
  ghost: 'text-forest-800 hover:text-honey-700',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-[0.82rem]',
  md: 'h-11 px-6 text-[0.9rem]',
  lg: 'h-13 px-7 text-[0.95rem] sm:h-14 sm:px-9 sm:text-base',
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
  /** Mostra a seta que desliza no hover. */
  arrow?: boolean;
};

function inner(children: ReactNode, arrow?: boolean) {
  return (
    <>
      {children}
      {arrow ? (
        <svg viewBox="0 0 20 20" className="h-4 w-4 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/btn:translate-x-0.5" aria-hidden>
          <path d="M4 10h11M11 5.5 15.5 10 11 14.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </>
  );
}

export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  arrow,
  ...rest
}: CommonProps & { href: string } & Omit<ComponentPropsWithoutRef<typeof Link>, 'href' | 'className' | 'children'>) {
  const external = href.startsWith('http') || href.startsWith('tel:') || href.startsWith('mailto:');
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

  if (external) {
    return (
      <a href={href} className={classes} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
        {inner(children, arrow)}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} {...rest}>
      {inner(children, arrow)}
    </Link>
  );
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  arrow,
  ...rest
}: CommonProps & ComponentPropsWithoutRef<'button'>) {
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest}>
      {inner(children, arrow)}
    </button>
  );
}
