const LedgerEntry = require("../models/LedgerEntry");
const Customer = require("../models/Customer");

/**
 * @desc   Get ledger entries. Optionally filter by customerId.
 * @route  GET /api/ledger
 * @query  ?customerId=xxx
 */
exports.getLedgerEntries = async (req, res) => {
  try {
    const filter = {};
    if (req.query.customerId) filter.customerId = req.query.customerId;

    const entries = await LedgerEntry.find(filter).sort({ createdAt: -1 });
    res.json(entries);
  } catch (error) {
    console.error("getLedgerEntries error:", error);
    res.status(500).json({ message: "Server error fetching ledger entries" });
  }
};

/**
 * @desc   Create a new ledger entry (idempotent via clientId).
 *         Also updates the cached balance on the customer document.
 * @route  POST /api/ledger
 */
exports.createLedgerEntry = async (req, res) => {
  try {
    const { clientId, customerId, type, amount, description, invoiceId } = req.body;

    if (!clientId || !customerId || !type || amount == null) {
      return res.status(400).json({
        message: "clientId, customerId, type, and amount are required",
      });
    }

    if (!["credit", "debit"].includes(type)) {
      return res.status(400).json({ message: "type must be 'credit' or 'debit'" });
    }

    // Append-only: only insert if this clientId doesn't already exist
    let entry = await LedgerEntry.findOne({ clientId });
    if (entry) {
      // Already synced — return existing (deduplicate)
      return res.status(200).json(entry);
    }

    entry = await LedgerEntry.create({
      clientId,
      customerId,
      type,
      amount,
      description: description || "",
      invoiceId: invoiceId || null,
    });

    // Update cached balance on the customer
    const balanceDelta = type === "credit" ? amount : -amount;
    await Customer.findOneAndUpdate(
      { clientId: customerId },
      { $inc: { balance: balanceDelta } }
    );

    res.status(201).json(entry);
  } catch (error) {
    console.error("createLedgerEntry error:", error);
    res.status(500).json({ message: "Server error creating ledger entry" });
  }
};

/**
 * @desc   Get the calculated balance for a customer from ledger entries
 * @route  GET /api/ledger/balance/:customerId
 */
exports.getCustomerBalance = async (req, res) => {
  try {
    const { customerId } = req.params;
    const entries = await LedgerEntry.find({ customerId });

    let balance = 0;
    for (const entry of entries) {
      if (entry.type === "credit") balance += entry.amount;
      else if (entry.type === "debit") balance -= entry.amount;
    }

    res.json({ customerId, balance, entryCount: entries.length });
  } catch (error) {
    console.error("getCustomerBalance error:", error);
    res.status(500).json({ message: "Server error getting balance" });
  }
};
