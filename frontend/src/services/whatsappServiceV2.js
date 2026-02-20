/**
 * NanoBiz — WhatsApp Service V2
 *
 * Handles WhatsApp invoice sending with sync-awareness.
 *
 * RULES:
 *  - WhatsApp must ONLY be sent AFTER successful server sync
 *  - If invoice is unsynced, show a warning instead
 *  - After sync, auto-send is handled by syncManagerV2
 *  - Manual send can be triggered via sendWhatsAppIfSynced()
 *
 * ──────────────────────────────────────────────────────────────
 * USAGE:
 *   import { sendWhatsAppIfSynced, canSendWhatsApp } from "../services/whatsappServiceV2";
 *
 *   // Check before showing button state:
 *   const allowed = canSendWhatsApp(invoice); // returns boolean
 *
 *   // Send (opens WhatsApp):
 *   const result = await sendWhatsAppIfSynced(invoice, customer);
 *   if (!result.ok) alert(result.message);
 * ──────────────────────────────────────────────────────────────
 *
 * NOTE: This is a NEW file. The existing whatsapp.js is untouched.
 */

import db from "../db/schema";
import { sendWhatsApp as serverSendWhatsApp } from "./apiService";

/**
 * Check if a WhatsApp message can be sent for this invoice.
 *
 * @param {object} invoice — local invoice record
 * @returns {boolean}
 */
export function canSendWhatsApp(invoice) {
  return Boolean(invoice && invoice.synced && !invoice.whatsappSent);
}

/**
 * Get the WhatsApp status message for UI display.
 *
 * @param {object} invoice
 * @returns {{ allowed: boolean, message: string, variant: "success"|"warning"|"info" }}
 */
export function getWhatsAppStatus(invoice) {
  if (!invoice) {
    return { allowed: false, message: "No invoice selected", variant: "info" };
  }

  if (invoice.whatsappSent) {
    return { allowed: false, message: "WhatsApp already sent ✓", variant: "success" };
  }

  if (!invoice.synced) {
    return {
      allowed: false,
      message: "⚠ Invoice not synced yet. WhatsApp will be sent automatically after sync.",
      variant: "warning",
    };
  }

  return { allowed: true, message: "Ready to send via WhatsApp", variant: "success" };
}

/**
 * Send a WhatsApp invoice — only if the invoice is synced.
 *
 * Flow:
 *  1. Check if synced (guard)
 *  2. Call server endpoint to generate WhatsApp link
 *  3. Open the link in a new tab
 *  4. Mark whatsappSent locally
 *
 * @param {object} invoice — local invoice record with { id, synced, whatsappSent, items, total, status }
 * @param {object} customer — local customer record with { phone }
 * @returns {Promise<{ ok: boolean, message: string, url?: string }>}
 */
export async function sendWhatsAppIfSynced(invoice, customer) {
  // Guard: must be synced
  if (!invoice.synced) {
    return {
      ok: false,
      message: "Invoice not synced yet. WhatsApp will be sent automatically after sync.",
    };
  }

  // Guard: already sent
  if (invoice.whatsappSent) {
    return { ok: false, message: "WhatsApp already sent for this invoice." };
  }

  // Guard: need phone number
  if (!customer || !customer.phone) {
    return { ok: false, message: "Customer phone number not available." };
  }

  try {
    // Try server-side send (updates whatsappSent on server too)
    if (navigator.onLine) {
      const result = await serverSendWhatsApp(invoice.id);

      // Mark locally
      await db.invoices.update(invoice.id, { whatsappSent: true });

      // Open WhatsApp link if returned
      if (result.url) {
        window.open(result.url, "_blank");
      }

      return { ok: true, message: "WhatsApp invoice sent!", url: result.url };
    }

    // Fallback: generate link locally (offline)
    return generateLocalWhatsAppLink(invoice, customer);
  } catch (err) {
    console.warn("[WhatsApp] Server send failed, falling back to local link:", err.message);
    return generateLocalWhatsAppLink(invoice, customer);
  }
}

/**
 * Generate a WhatsApp link locally (fallback when server is unreachable).
 * Does NOT mark whatsappSent since we can't confirm delivery.
 */
function generateLocalWhatsAppLink(invoice, customer) {
  const itemLines = (invoice.items || [])
    .map((i) => `  • ${i.name}  ×${i.qty}  ₹${i.price}`)
    .join("\n");

  const message = [
    `🧾 *NanoBiz Invoice*`,
    `──────────────`,
    itemLines,
    `──────────────`,
    `*Total:* ₹${invoice.total}`,
    `*Status:* ${invoice.status}`,
    ``,
    `Thank you for your business!`,
  ].join("\n");

  const cleanPhone = customer.phone.replace(/\D/g, "");
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

  window.open(url, "_blank");

  return {
    ok: true,
    message: "WhatsApp link opened (local fallback — will mark as sent after sync)",
    url,
  };
}
