type BeeMarkProps = {
  className?: string;
  title?: string;
};

/**
 * Marca gráfica da Vida Natural: abelha dentro de um favo.
 * Herda a cor do texto (`currentColor`) e o dourado vem do `accent`.
 */
export function BeeMark({ className, title }: BeeMarkProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} role={title ? 'img' : 'presentation'} aria-hidden={!title}>
      {title ? <title>{title}</title> : null}
      {/* favo */}
      <path
        d="M24 2.8 42.5 13.4v21.2L24 45.2 5.5 34.6V13.4z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        opacity="0.55"
      />
      {/* asas */}
      <path
        d="M24 17.6c-2.6-4.5-6.4-6.6-8.7-5.1-2.2 1.5-1.6 5.6 1.5 8.2M24 17.6c2.6-4.5 6.4-6.6 8.7-5.1 2.2 1.5 1.6 5.6-1.5 8.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* corpo */}
      <path
        d="M24 16.8c3.9 0 6.6 2.9 6.6 7.1 0 5.6-3.2 11-6.6 13.5-3.4-2.5-6.6-7.9-6.6-13.5 0-4.2 2.7-7.1 6.6-7.1z"
        fill="var(--color-honey-400)"
      />
      {/* listras */}
      <path
        d="M18.2 22.4h11.6M17.8 27.4h12.4M19.6 32.4h8.8"
        stroke="var(--color-forest-900)"
        strokeWidth="1.7"
        strokeLinecap="round"
        opacity="0.85"
      />
      {/* antenas */}
      <path d="M21.8 15.6 20 12.4M26.2 15.6 28 12.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="19.6" cy="11.6" r="1.1" fill="currentColor" />
      <circle cx="28.4" cy="11.6" r="1.1" fill="currentColor" />
    </svg>
  );
}
