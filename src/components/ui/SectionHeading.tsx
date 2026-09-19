import type { ReactNode } from 'react';
import { RevealText } from './Reveal';

type SectionHeadingProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: 'left' | 'center';
  tone?: 'dark' | 'light';
  action?: ReactNode;
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  tone = 'dark',
  action,
  className = '',
}: SectionHeadingProps) {
  const alignment = align === 'center' ? 'items-center text-center' : 'items-start text-left';

  return (
    <div
      className={`flex flex-col gap-6 ${
        action ? 'md:flex-row md:items-end md:justify-between' : ''
      } ${className}`}
    >
      <RevealText className={`flex max-w-2xl flex-col ${alignment} ${align === 'center' ? 'mx-auto' : ''}`}>
        {eyebrow ? (
          <span
            className={`eyebrow mb-4 flex items-center gap-2.5 ${
              tone === 'light' ? 'text-honey-300' : 'text-honey-700'
            }`}
          >
            <span className={`h-px w-8 ${tone === 'light' ? 'bg-honey-300/60' : 'bg-honey-600/50'}`} aria-hidden />
            {eyebrow}
          </span>
        ) : null}
        <h2
          className={`text-[clamp(1.9rem,4.4vw,3.15rem)] leading-[1.06] ${
            tone === 'light' ? 'text-cream-100' : 'text-forest-900'
          }`}
        >
          {title}
        </h2>
        {description ? (
          <p
            className={`mt-5 max-w-xl text-[0.97rem] leading-relaxed sm:text-[1.02rem] ${
              tone === 'light' ? 'text-cream-200/80' : 'text-ink-muted'
            }`}
          >
            {description}
          </p>
        ) : null}
      </RevealText>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
