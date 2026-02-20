const Customer = require("../models/Customer");
const Invoice = require("../models/Invoice");

/**
 * @desc   Bulk-sync endpoint. Receives arrays of customers & invoices
 *         created offline and upserts them into MongoDB.
 * @route  POST /api/sync
 * @body   { customers: [...], invoices: [...] }
 */
exports.syncAll = async (req, res) => {
  try {
    const { customers = [], invoices = [] } = req.body;
    const results = { customers: [], invoices: [], errors: [] };

    // ── Sync Customers ────────────────────────────────────────
    for (const c of customers) {
      try {
        const doc = await Customer.findOneAndUpdate(
          { clientId: c.clientId },
          { clientId: c.clientId, name: c.name, phone: c.phone, address: c.address },
          { upsert: true, new: true, runValidators: true }
        );
        results.customers.push(doc);
      } catch (err) {
        results.errors.push({ type: "customer", clientId: c.clientId, error: err.message });
      }
    }

    // ── Sync Invoices ─────────────────────────────────────────
    for (const inv of invoices) {
      try {
        const doc = await Invoice.findOneAndUpdate(
          { clientId: inv.clientId },
          {
            clientId: inv.clientId,
            customerId: inv.customerId,
            items: inv.items,
            total: inv.total,
            status: inv.status || "pending",
            synced: true,
          },
          { upsert: true, new: true, runValidators: true }
        );
        results.invoices.push(doc);
      } catch (err) {
        results.errors.push({ type: "invoice", clientId: inv.clientId, error: err.message });
      }
    }

    res.json({
      message: "Sync complete",
      synced: {
        customers: results.customers.length,
        invoices: results.invoices.length,
      },
      errors: results.errors,
    });
  } catch (error) {
    console.error("syncAll error:", error);
    res.status(500).json({ message: "Server error during sync" });
  }
};
