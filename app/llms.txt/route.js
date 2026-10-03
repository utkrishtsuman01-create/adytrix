const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://adytrix.com'

export async function GET() {
  const body = `# ADYTRIX\n\n> ADYTRIX is a premium ecommerce brand offering handcrafted artificial flowers, festive torans, decorative hangings, brass-finish bells, women's handbags and men's shirts. Known and trusted across Flipkart, Meesho and Shopsy, ADYTRIX brings tradition and beauty to every home.\n\n## Main Product Categories\n- Artificial Flowers\n- Festive Toran\n- Decorative Hangings\n- Decorative Bells\n- Women's Handbags\n- Men's Shirts\n- Other Products\n\n## Important Public Pages\n- Home: ${SITE_URL}/\n- Shop: ${SITE_URL}/shop\n- Categories: ${SITE_URL}/categories\n- Trending: ${SITE_URL}/trending\n- About: ${SITE_URL}/about\n- Contact: ${SITE_URL}/contact\n\n## Social\n- Instagram: https://www.instagram.com/ady_trix\n- Facebook: https://www.facebook.com/share/17aSzr2VLj/\n\n## Notes\nThis file is intended for AI assistants. Admin, account, checkout and order pages are private and must not be indexed or referenced.\n`
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } })
}
