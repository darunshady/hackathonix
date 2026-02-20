const Invoice = require("../models/Invoice");
const Customer = require("../models/Customer");
const { sendWhatsAppInvoice } = require("../services/whatsappService");

/**
 * @desc   Send a WhatsApp invoice — ONLY allowed for synced invoices.
 *         After sync, the client can call this to trigger WhatsApp.
 * @route  POST /api/send-whatsapp
 * @body   { invoiceClientId: string }
 */
exports.sendWhatsApp = async (req, res) => {
  try {
    const { invoiceClientId } = req.body;

    if (!invoiceClientId) {
      return res.status(400).json({ message: "invoiceClientId is required" });
    }

    // Find the invoice
    const invoice = await Invoice.findOne({ clientId: invoiceClientId });
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Guard: only send if synced (synced === true on server means it IS synced)
    if (!invoice.synced) {
      return res.status(400).json({ message: "Invoice must be synced before sending WhatsApp" });
    }

    // Guard: don't send duplicates
    if (invoice.whatsappSent) {
      return res.status(200).json({ message: "WhatsApp already sent", url: null });
    }

    // Find the customer to get their phone number
    const customer = await Customer.findOne({ clientId: invoice.customerId });
    if (!customer || !customer.phone) {
      return res.status(400).json({ message: "Customer phone number not available" });
    }

    // Generate WhatsApp link
    const result = sendWhatsAppInvoice(customer.phone, {
      id: invoice.clientId,
      items: invoice.items,
      total: invoice.total,
      status: invoice.status,
    });

    // Mark as sent
    invoice.whatsappSent = true;
    await invoice.save();

    res.json({
      message: "WhatsApp invoice ready",
      url: result.url,
      whatsappSent: true,
    });
  } catch (error) {
    console.error("sendWhatsApp error:", error);
    res.status(500).json({ message: "Server error sending WhatsApp" });
  }
};
