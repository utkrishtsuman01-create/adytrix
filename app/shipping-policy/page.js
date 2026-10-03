import Breadcrumbs from '@/components/site/breadcrumbs'

export const metadata = { title: 'Shipping Policy', description: 'ADYTRIX shipping timelines, charges and delivery information.', alternates: { canonical: '/shipping-policy' } }

export default function ShippingPage() {
  return (
    <div className="container max-w-3xl py-8">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Shipping Policy' }]} />
      <h1 className="mt-4 font-display text-4xl">Shipping Policy</h1>
      <div className="mt-6 space-y-5 text-muted-foreground leading-relaxed">
        <div><h2 className="font-display text-xl text-foreground">Shipping Charges</h2><p className="mt-2">We offer free shipping on all orders over ₹999. For orders below this amount, a flat shipping fee is applied at checkout.</p></div>
        <div><h2 className="font-display text-xl text-foreground">Delivery Time</h2><p className="mt-2">Orders are typically processed within 1–2 business days and delivered within 4–8 business days, depending on your location.</p></div>
        <div><h2 className="font-display text-xl text-foreground">Order Tracking</h2><p className="mt-2">You can track your order status anytime from the My Orders section of your account.</p></div>
        <div><h2 className="font-display text-xl text-foreground">Delays</h2><p className="mt-2">Deliveries may occasionally be delayed during festive seasons or due to factors beyond our control. We appreciate your patience.</p></div>
      </div>
    </div>
  )
}
