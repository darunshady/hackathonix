/**
 * WhatsApp Service — Frontend placeholder.
 *
 * Generates a wa.me deep-link that opens WhatsApp with a
 * pre-filled invoice summary message.
 */

/**
 * Open WhatsApp with a formatted invoice message.
 * @param {string} phone       – customer phone (with country code)
 * @param {object} invoiceData – { id, items, total, status }
 */
export function sendWhatsAppInvoice(phone, invoiceData) {
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

  const cleanPhone = phone.replace(/\D/g, "");
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

  // Open in a new tab / WhatsApp app
  try {
    window.open(url, "_blank");
  } catch (e) {
    console.error("[WhatsApp] Failed to open link:", e);
  }
}
