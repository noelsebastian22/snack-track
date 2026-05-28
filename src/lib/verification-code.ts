/**
 * Generate a 6-digit numeric verification code.
 */
export function generateVerificationCode(): string {
  const digits = '0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += digits[Math.floor(Math.random() * 10)]
  }
  return result
}

/**
 * Generate a human-readable short order ID from customer name and phone.
 * Example: "AHMAD" + "+1234567890" → "AHMA28F4"
 */
export function generateShortOrderId(customerName: string, phone: string): string {
  const namePart = customerName.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3)
  const phoneDigits = phone.replace(/\D/g, '')
  const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `${namePart}${phoneDigits.slice(-2)}${randomPart}`
}
