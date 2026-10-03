import Breadcrumbs from '@/components/site/breadcrumbs'

export const metadata = { title: 'Terms & Conditions', description: 'The terms and conditions governing use of the ADYTRIX website and purchases.', alternates: { canonical: '/terms' } }

export default function TermsPage() {
  return (
    <div className="container max-w-3xl py-8">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Terms & Conditions' }]} />
      <h1 className="mt-4 font-display text-4xl">Terms & Conditions</h1>
      <div className="mt-6 space-y-5 text-muted-foreground leading-relaxed">
        <p>By using the ADYTRIX website and placing an order, you agree to the following terms.</p>
        <div><h2 className="font-display text-xl text-foreground">Orders</h2><p className="mt-2">All orders are subject to acceptance and product availability. Prices and offers are shown on each product page and may change over time; the price applied is the one at the time of order.</p></div>
        <div><h2 className="font-display text-xl text-foreground">Pricing</h2><p className="mt-2">Order totals, discounts and shipping are calculated by our servers at checkout. The final payable amount shown at checkout is authoritative.</p></div>
        <div><h2 className="font-display text-xl text-foreground">Payments</h2><p className="mt-2">Payments are processed securely. Orders are confirmed once payment is verified or, for Cash on Delivery, once the order is accepted.</p></div>
        <div><h2 className="font-display text-xl text-foreground">Intellectual Property</h2><p className="mt-2">All content, images and branding on this site belong to ADYTRIX and may not be reused without permission.</p></div>
      </div>
    </div>
  )
}
