'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { site, whatsappLink } from '@/lib/site';

/** Botão flutuante de WhatsApp — aparece depois da primeira dobra. */
export function WhatsAppButton() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 420);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.a
          href={whatsappLink('Olá! Vim pelo site da Vida Natural e gostaria de tirar uma dúvida.')}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Falar no WhatsApp ${site.contact.whatsapp}`}
          onHoverStart={() => setExpanded(true)}
          onHoverEnd={() => setExpanded(false)}
          initial={{ opacity: 0, scale: 0.8, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 12 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          className="fixed bottom-5 right-4 z-[60] flex items-center gap-3 rounded-full bg-forest-700 py-3 pl-3.5 pr-4 text-cream-50 shadow-[0_14px_36px_-14px_rgba(20,33,26,0.9)] transition-colors duration-300 hover:bg-forest-600 sm:bottom-7 sm:right-7"
        >
          <span className="relative grid h-7 w-7 place-items-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-honey-400/25" aria-hidden />
            <svg viewBox="0 0 24 24" className="relative h-6 w-6" aria-hidden>
              <path
                d="M12 2.6a9.4 9.4 0 0 0-8 14.3L2.6 21.4l4.7-1.3A9.4 9.4 0 1 0 12 2.6z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M8.7 7.9c.3-.6.6-.6.9-.6h.6c.2 0 .5 0 .8.5l.7 1.7c.1.3 0 .5-.1.7l-.4.5c-.2.2-.3.4-.1.7.2.4.8 1.3 1.7 2 .9.7 1.5 1 1.8.8.2-.1.4-.3.6-.6l.4-.5c.2-.2.5-.2.7-.1l1.6.8c.3.2.4.4.4.7 0 .3-.2.9-.6 1.3-.4.4-1.1.8-1.9.8-1.2 0-3-.8-4.6-2.2-1.7-1.6-2.7-3.5-2.8-4.6-.1-.8.2-1.5.6-1.9z"
                fill="currentColor"
              />
            </svg>
          </span>
          <motion.span
            initial={false}
            animate={{ width: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden whitespace-nowrap text-sm"
          >
            <span className="pr-1">Fale com a gente</span>
          </motion.span>
        </motion.a>
      ) : null}
    </AnimatePresence>
  );
}
