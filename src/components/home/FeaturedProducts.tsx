import { getFeaturedProducts, getProducts } from '@/server/catalog';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ButtonLink } from '@/components/ui/Button';
import { ProductGrid } from '@/components/product/ProductGrid';

export async function FeaturedProducts() {
  const [featured, all] = await Promise.all([getFeaturedProducts(), getProducts()]);

  return (
    <section className="container-page py-20 sm:py-24 lg:py-28" aria-labelledby="favoritos-titulo">
      <SectionHeading
        eyebrow="Mais procurados"
        title={
          <span id="favoritos-titulo">
            Os favoritos da <span className="italic text-honey-700">Vida Natural</span>
          </span>
        }
        description="Um recorte com o que sai mais da nossa loja de fábrica — dos méis raros ao própolis de todo dia."
        action={
          <ButtonLink href="/produtos" variant="outline" arrow>
            Ver todos os {all.length} produtos
          </ButtonLink>
        }
        className="mb-14"
      />

      <ProductGrid products={featured} columns={4} />
    </section>
  );
}
