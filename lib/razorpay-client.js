'use client'

let scriptPromise = null

function loadRazorpayScript() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'))
  if (window.Razorpay) return Promise.resolve()
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve()
    s.onerror = () => { scriptPromise = null; reject(new Error('Failed to load Razorpay')) }
    document.body.appendChild(s)
  })
  return scriptPromise
}

// Starts Razorpay Checkout for an already-created ADYTRIX order (by our order id).
// Resolves with { status: 'paid' | 'failed' | 'dismissed', data }.
export async function startRazorpayPayment({ orderId, prefill = {} }) {
  const res = await fetch('/api/payment/order', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId }),
  })
  const pay = await res.json()
  if (!res.ok) throw new Error(pay.error || 'Could not start payment')
  await loadRazorpayScript()

  return new Promise((resolve) => {
    let settled = false
    const done = (result) => { if (!settled) { settled = true; resolve(result) } }
    const rzp = new window.Razorpay({
      key: pay.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      order_id: pay.orderId,
      amount: pay.amount,
      currency: pay.currency,
      name: 'ADYTRIX',
      description: 'ADYTRIX Order Payment',
      image: '/icon.png',
      prefill: { name: prefill.name || '', email: prefill.email || '', contact: prefill.phone || '' },
      theme: { color: '#B8862F' },
      handler: async (response) => {
        try {
          const v = await fetch('/api/payment/verify', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(response),
          })
          const r = await v.json()
          done({ status: v.ok && r.verified ? 'paid' : 'failed', data: r })
        } catch (e) {
          done({ status: 'failed', data: { error: e.message } })
        }
      },
      modal: { ondismiss: () => done({ status: 'dismissed' }) },
    })
    rzp.on('payment.failed', () => done({ status: 'failed', data: {} }))
    rzp.open()
  })
}
