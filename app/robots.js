const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://adytrix.com'

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/', '/profile', '/orders', '/checkout', '/cart', '/api/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
