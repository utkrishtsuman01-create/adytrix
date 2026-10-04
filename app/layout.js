import './globals.css'
import { Providers } from './providers'
import { CartProvider } from '@/components/site/cart'
import Header from '@/components/site/header'
import Footer from '@/components/site/footer'
import { Toaster } from '@/components/ui/sonner'
import { SITE_DESCRIPTION } from '@/lib/site'

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://adytrix.com'

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'ADYTRIX | Premium Artificial Flowers & Lifestyle Products',
    template: '%s | ADYTRIX',
  },
  description: SITE_DESCRIPTION,
  applicationName: 'ADYTRIX',
  keywords: ['ADYTRIX', 'artificial flowers', 'festive toran', 'decorative hangings', 'brass bells', "women's handbags", "men's shirts", 'home decor India'],
  authors: [{ name: 'ADYTRIX' }],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'ADYTRIX',
    title: 'ADYTRIX | Where Tradition Meets Beauty',
    description: SITE_DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ADYTRIX | Premium Artificial Flowers & Lifestyle Products',
    description: SITE_DESCRIPTION,
  },
  icons: { icon: '/adytrix-favicon.svg', shortcut: '/adytrix-favicon.svg', apple: '/adytrix-favicon.svg' },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'ADYTRIX',
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        sameAs: [
          'https://www.facebook.com/share/17aSzr2VLj/',
          'https://www.instagram.com/ady_trix',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: 'ADYTRIX',
        publisher: { '@id': `${SITE_URL}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SITE_URL}/shop?search={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  }

  return (
    <html lang="en">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <script dangerouslySetInnerHTML={{ __html: 'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);' }} />
      </head>
      <body>
        <Providers>
          <CartProvider>
            <Header />
            <main className="min-h-[60vh]">{children}</main>
            <Footer />
            <Toaster richColors position="top-center" />
          </CartProvider>
        </Providers>
      </body>
    </html>
  )
}
