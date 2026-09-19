import type { MetadataRoute } from 'next';
import { getCategories, getProductSlugs } from '@/server/catalog';
import { policyPages } from '@/lib/pages';
import { site } from '@/lib/site';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [categories, productSlugs] = await Promise.all([getCategories(), getProductSlugs()]);

  return [
    { url: site.url, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${site.url}/produtos`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${site.url}/sobre`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${site.url}/contato`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    ...categories.map((category) => ({
      url: `${site.url}/categoria/${category.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...productSlugs.map((slug) => ({
      url: `${site.url}/produtos/${slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...policyPages.map((page) => ({
      url: `${site.url}/politicas/${page.slug}`,
      lastModified: now,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    })),
  ];
}
