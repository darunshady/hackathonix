const Invoice = require("../models/Invoice");

/**
 * @desc   Get all invoices, newest first
 * @route  GET /api/invoices
 */
exports.getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
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
    const { clientId, customerId, items, total, status } = req.body;

    if (!clientId || !customerId || !items || items.length === 0) {
      return res.status(400).json({
        message: "clientId, customerId, and at least one item are required",
      });
    }

    const invoice = await Invoice.findOneAndUpdate(
      { clientId },
      { clientId, customerId, items, total, status: status || "pending", synced: true },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(201).json(invoice);
  } catch (error) {
    console.error("createInvoice error:", error);
    res.status(500).json({ message: "Server error creating invoice" });
  }
};
