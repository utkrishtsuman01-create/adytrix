const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_API_VERSION || 'v26.0'

export function whatsappReviewConfigured() {
  return Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN &&
    process.env.WHATSAPP_PHONE_NUMBER_ID &&
    process.env.WHATSAPP_REVIEW_TEMPLATE_NAME
  )
}

function normalizeWhatsAppNumber(value) {
  let digits = String(value || '').replace(/\D/g, '')
  if (digits.length === 10) digits = `91${digits}`
  else if (digits.length === 11 && digits.startsWith('0')) digits = `91${digits.slice(1)}`
  if (digits.length < 11 || digits.length > 15) return ''
  return digits
}

/**
 * Sends an approved WhatsApp template message to a customer who explicitly
 * opted in at checkout. The template must have three body parameters:
 * customer name, order number, and review URL.
 */
export async function sendReviewWhatsApp(order) {
  if (!order?.whatsappReviewOptIn) {
    return { sent: false, status: 'opted_out', error: 'Customer has not opted in to WhatsApp review messages.' }
  }

  if (order.reviewWhatsAppSentAt) {
    return { sent: true, status: 'already_sent', messageId: order.reviewWhatsAppMessageId || null }
  }

  const missing = []
  if (!process.env.WHATSAPP_ACCESS_TOKEN) missing.push('WHATSAPP_ACCESS_TOKEN')
  if (!process.env.WHATSAPP_PHONE_NUMBER_ID) missing.push('WHATSAPP_PHONE_NUMBER_ID')
  if (!process.env.WHATSAPP_REVIEW_TEMPLATE_NAME) missing.push('WHATSAPP_REVIEW_TEMPLATE_NAME')
  if (missing.length) {
    return { sent: false, status: 'not_configured', error: `Missing Vercel environment variables: ${missing.join(', ')}` }
  }

  const to = normalizeWhatsAppNumber(order.deliveryAddress?.phone)
  if (!to) {
    return { sent: false, status: 'failed', error: 'The order phone number is not a valid WhatsApp recipient number.' }
  }

  let baseUrl = String(
    process.env.WHATSAPP_REVIEW_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://adytrix.in')
  )
  while (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1)
  const reviewUrl = order.reviewAccessToken
    ? `${baseUrl}/review/${encodeURIComponent(order.reviewAccessToken)}`
    : `${baseUrl}/orders/${encodeURIComponent(order.id)}#items`
  const customerName = String(order.deliveryAddress?.name || 'Customer').trim().slice(0, 100)

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'template',
    template: {
      name: process.env.WHATSAPP_REVIEW_TEMPLATE_NAME,
      language: { code: process.env.WHATSAPP_REVIEW_TEMPLATE_LANGUAGE || 'en_US' },
      components: [{
        type: 'body',
        parameters: [
          { type: 'text', text: customerName },
          { type: 'text', text: String(order.orderNumber || '') },
          { type: 'text', text: reviewUrl },
        ],
      }],
    },
  }

  try {
    const response = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      const message = data?.error?.message || `WhatsApp API returned HTTP ${response.status}`
      return { sent: false, status: 'failed', error: String(message).slice(0, 500) }
    }

    return {
      sent: true,
      status: 'sent',
      messageId: data?.messages?.[0]?.id || null,
      reviewUrl,
    }
  } catch (e) {
    return { sent: false, status: 'failed', error: String(e?.message || 'WhatsApp request failed').slice(0, 500) }
  }
}
