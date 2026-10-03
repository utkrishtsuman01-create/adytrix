import Breadcrumbs from '@/components/site/breadcrumbs'

export const metadata = { title: 'Return & Refund Policy', description: 'ADYTRIX return, replacement and refund policy for your peace of mind.', alternates: { canonical: '/return-refund-policy' } }

export default function ReturnPage() {
  return (
    <div className="container max-w-3xl py-8">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Return & Refund Policy' }]} />
      <h1 className="mt-4 font-display text-4xl">Return & Refund Policy</h1>
      <div className="mt-6 space-y-5 text-muted-foreground leading-relaxed">
        <div><h2 className="font-display text-xl text-foreground">Returns</h2><p className="mt-2">If you receive a damaged or incorrect item, please contact us within 3 days of delivery with photos, and we will arrange a replacement or refund.</p></div>
        <div><h2 className="font-display text-xl text-foreground">Eligibility</h2><p className="mt-2">Items must be unused and in their original condition and packaging. Certain handcrafted items may have slight natural variations, which are not considered defects.</p></div>
        <div><h2 className="font-display text-xl text-foreground">Refunds</h2><p className="mt-2">Approved refunds are processed to your original payment method within 5–7 business days of the returned item being received and inspected.</p></div>
        <div><h2 className="font-display text-xl text-foreground">How to Request</h2><p className="mt-2">Reach out through our Instagram or Facebook channels with your order number to start a return or refund request.</p></div>
      </div>
    </div>
  )
}
