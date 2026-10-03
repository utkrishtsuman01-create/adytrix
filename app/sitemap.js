import { getAllProductSlugs, getActiveCategories } from '@/lib/data'

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://adytrix.com'

export default async function sitemap() {
  const now = new Date()
  const staticRoutes = ['', '/shop', '/categories', '/trending', '/about', '/contact', '/privacy-policy', '/terms', '/shipping-policy', '/return-refund-policy']
    .map((p) => ({ url: `${SITE_URL}${p}`, lastModified: now, changeFrequency: 'weekly', priority: p === '' ? 1 : 0.7 }))
  let dynamicRoutes = []
  try {
    const [products, categories] = await Promise.all([getAllProductSlugs(), getActiveCategories()])
    dynamicRoutes = [
      ...categories.map((c) => ({ url: `${SITE_URL}/categories/${c.slug}`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 })),
      ...products.map((p) => ({ url: `${SITE_URL}/products/${p.slug}`, lastModified: p.updatedAt || now, changeFrequency: 'weekly', priority: 0.8 })),
    ]
  } catch {}
  return [...staticRoutes, ...dynamicRoutes]
}
