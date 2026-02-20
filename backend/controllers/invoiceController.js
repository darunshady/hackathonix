const Invoice = require("../models/Invoice");

/**
 * @desc   Get all invoices, newest first. Optionally filter by customerId.
 * @route  GET /api/invoices
 * @query  ?customerId=xxx
 */
exports.getInvoices = async (req, res) => {
  try {
    const filter = {};
    if (req.query.customerId) filter.customerId = req.query.customerId;

    const invoices = await Invoice.find(filter).sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    console.error("getInvoices error:", error);
    res.status(500).json({ message: "Server error fetching invoices" });
  }
};

/**
 * @desc   Create a new invoice (idempotent via clientId upsert)
 * @route  POST /api/invoices
 */
exports.createInvoice = async (req, res) => {
  try {
    const { clientId, customerId, items, total, status, whatsappSent } = req.body;

    if (!clientId || !customerId || !items || items.length === 0) {
      return res.status(400).json({
        message: "clientId, customerId, and at least one item are required",
      });
    }

    // Client always wins — upsert overwrites server data
    const invoice = await Invoice.findOneAndUpdate(
      { clientId },
      {
        clientId,
        customerId,
        items,
        total,
        status: status || "pending",
        synced: true,
        whatsappSent: whatsappSent || false,
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(201).json(invoice);
  } catch (error) {
    console.error("createInvoice error:", error);
    res.status(500).json({ message: "Server error creating invoice" });
  }
};

/**
 * @desc   Update an existing invoice (client always wins)
 * @route  PUT /api/invoices/:clientId
 */
exports.updateInvoice = async (req, res) => {
  try {
    const { items, total, status, whatsappSent } = req.body;

    const invoice = await Invoice.findOneAndUpdate(
      { clientId: req.params.clientId },
      { items, total, status, whatsappSent },
      { new: true, runValidators: true }
    );

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.json(invoice);
  } catch (error) {
    console.error("updateInvoice error:", error);
    res.status(500).json({ message: "Server error updating invoice" });
  }
};

/**
 * @desc   Mark an invoice's whatsappSent flag
 * @route  PUT /api/invoices/:clientId/whatsapp-sent
 */
exports.markWhatsappSent = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { clientId: req.params.clientId },
      { whatsappSent: true },
      { new: true }
    );

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.json(invoice);
  } catch (error) {
    console.error("markWhatsappSent error:", error);
    res.status(500).json({ message: "Server error marking whatsapp sent" });
  }
};
