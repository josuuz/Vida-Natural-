import type { DescriptionBlock } from '@/lib/types';

/**
 * Renderiza a descrição oficial do produto. O texto vem exatamente como está
 * publicado em vidanat.com.br — aqui ele só ganha hierarquia tipográfica.
 */
export function ProductDescription({ blocks }: { blocks: DescriptionBlock[] }) {
  if (!blocks.length) return null;

  const headings = blocks.filter((block) => block.kind === 'heading');
  const features = blocks.filter((block) => block.kind === 'feature');
  const paragraphs = blocks.filter((block) => block.kind === 'paragraph');

  return (
    <div className="flex flex-col gap-8">
      {headings.length ? (
        <div>
          {headings.map((block) => (
            <h2 key={block.text} className="text-[1.5rem] leading-snug text-forest-900 sm:text-[1.75rem]">
              {block.text}
            </h2>
          ))}
        </div>
      ) : null}

      {paragraphs.length ? (
        <div className="flex flex-col gap-4">
          {paragraphs.map((block) => (
            <p key={block.text} className="text-[0.97rem] leading-relaxed text-ink-soft">
              {block.emoji ? <span className="mr-1.5">{block.emoji}</span> : null}
              {block.text}
            </p>
          ))}
        </div>
      ) : null}

      {features.length ? (
        <ul className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
          {features.map((block) => (
            <li key={block.label} className="border-t border-line pt-4">
              <p className="flex items-baseline gap-2 text-[0.95rem] text-forest-900">
                {block.emoji ? (
                  <span aria-hidden className="text-base">
                    {block.emoji}
                  </span>
                ) : null}
                <span className="font-medium">{block.label}</span>
              </p>
              <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-muted">{block.text}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
