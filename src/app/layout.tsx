import type { Metadata, Viewport } from 'next';
import { Figtree, Fraunces } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppButton } from '@/components/layout/WhatsAppButton';
import { CartProvider } from '@/components/cart/CartProvider';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { site } from '@/lib/site';
import { getCategories } from '@/server/catalog';

const fraunces = Fraunces({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-fraunces',
});

const figtree = Figtree({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-figtree',
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: 'Vida Natural — Méis de abelhas sem ferrão, méis florais e própolis',
    template: '%s | Vida Natural',
  },
  description: site.description,
  applicationName: site.name,
  keywords: [
    'mel de abelhas sem ferrão',
    'mel de uruçu',
    'mel de jataí',
    'extrato de própolis',
    'mel de flores silvestres',
    'própolis verde',
    'Vida Natural',
  ],
  authors: [{ name: site.legalName }],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: site.name,
    title: 'Vida Natural — Méis de abelhas sem ferrão, méis florais e própolis',
    description: site.description,
    url: site.url,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vida Natural',
    description: site.description,
  },
  robots: { index: true, follow: true },
  alternates: { canonical: '/' },
};

export const viewport: Viewport = {
  themeColor: '#14211a',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategories();

  return (
    <html lang="pt-BR" className={`${fraunces.variable} ${figtree.variable}`}>
      <body className="min-h-screen antialiased">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-forest-800 focus:px-5 focus:py-2.5 focus:text-sm focus:text-cream-50"
        >
          Pular para o conteúdo
        </a>
        <CartProvider>
          <Header categories={categories} />
          <main id="conteudo">{children}</main>
          <Footer />
          <WhatsAppButton />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
