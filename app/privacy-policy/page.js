import Breadcrumbs from '@/components/site/breadcrumbs'

export const metadata = { title: 'Privacy Policy', description: 'How ADYTRIX collects, uses and protects your personal information.', alternates: { canonical: '/privacy-policy' } }

export default function PrivacyPage() {
  return (
    <div className="container max-w-3xl py-8">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Privacy Policy' }]} />
      <h1 className="mt-4 font-display text-4xl">Privacy Policy</h1>
      <div className="mt-6 space-y-5 text-muted-foreground leading-relaxed">
        <p>At ADYTRIX, your privacy matters to us. This policy explains what information we collect and how we use it.</p>
        <div><h2 className="font-display text-xl text-foreground">Information We Collect</h2><p className="mt-2">We collect the information you provide when creating an account or placing an order, including your name, email, phone number and delivery address. We do not store card numbers, CVV or sensitive payment credentials.</p></div>
        <div><h2 className="font-display text-xl text-foreground">How We Use It</h2><p className="mt-2">Your information is used solely to process orders, provide customer support, and improve your shopping experience. We never sell your personal data.</p></div>
        <div><h2 className="font-display text-xl text-foreground">Data Security</h2><p className="mt-2">Passwords are stored using strong one-way hashing and are never visible to anyone. Access to your orders and account is protected and restricted to you and authorised staff.</p></div>
        <div><h2 className="font-display text-xl text-foreground">Contact</h2><p className="mt-2">For any privacy-related questions, reach us via our Instagram or Facebook channels.</p></div>
      </div>
    </div>
  )
}
