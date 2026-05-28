import Twilio from 'twilio'

const client = Twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

/**
 * Send a WhatsApp message to a single recipient.
 * Uses Twilio's WhatsApp Numbers API (FROM: TWILIO_WHATSAPP_NUMBER).
 */
export async function sendWhatsApp(
  to: string,
  body: string
): Promise<string> {
  const from = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`
  const resolvedTo = to.startsWith('whatsapp:') ? to : `whatsapp:+${to.replace(/\D/g, '')}`

  try {
    const message = await client.messages.create({
      body,
      from,
      to: resolvedTo,
    })

    console.log(`[WhatsApp Sent] to=${resolvedTo} sid=${message.sid}`)
    return message.sid
  } catch (error) {
    console.error('[WhatsApp Send Error]', error)
    throw error
  }
}

/**
 * Send order confirmation to a customer's WhatsApp.
 */
export async function sendOrderConfirmation(
  phone: string,
  shortOrderId: string,
  verificationCode: string,
  totalAmountCents: number
): Promise<string> {
  return sendWhatsApp(phone,
    `Your snack order is confirmed!

Order ID: ${shortOrderId}
Verification Code: ${verificationCode}
Total: $${(totalAmountCents / 100).toFixed(2)}

Pickup code ready when you arrive.
Reply "menu" for a new order.`
  )
}
