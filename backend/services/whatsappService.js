/**
 * WhatsApp Integration Service — Placeholder
 *
 * In a production app you would integrate with:
 *   - WhatsApp Business API (official)
 *   - Twilio WhatsApp Sandbox
 *   - WATI or similar third-party provider
 *
 * For now this simply logs the intent and returns a
 * wa.me deep-link that opens WhatsApp with a prefilled message.
 */

/**
 * Build a shareable WhatsApp link for an invoice.
 * @param {string} phone  – customer phone number (with country code)
 * @param {object} invoiceData – { id, items, total, status }
 * @returns {{ url: string, message: string }}
 */
function sendWhatsAppInvoice(phone, invoiceData) {
  // Format a human-readable invoice message
  const itemLines = invoiceData.items
    .map((i) => `  • ${i.name}  ×${i.qty}  ₹${i.price}`)
    .join("\n");

  const message = [
    `🧾 *NanoBiz Invoice*`,
    `──────────────`,
    itemLines,
    `──────────────`,
    `*Total:* ₹${invoiceData.total}`,
    `*Status:* ${invoiceData.status}`,
    ``,
    `Thank you for your business!`,
  ].join("\n");

  const encoded = encodeURIComponent(message);
  const cleanPhone = phone.replace(/\D/g, ""); // strip non-digits
  const url = `https://wa.me/${cleanPhone}?text=${encoded}`;

  console.log(`[WhatsApp] Generated link for ${cleanPhone}`);
  return { url, message };
}

module.exports = { sendWhatsAppInvoice };
