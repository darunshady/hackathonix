const Customer = require("../models/Customer");
const Invoice = require("../models/Invoice");
const LedgerEntry = require("../models/LedgerEntry");
const Payment = require("../models/Payment");

/**
 * @desc   Bulk-sync endpoint. Receives arrays of customers, invoices,
 *         ledger entries, and payments created offline and upserts /
 *         appends them into MongoDB.
 *
 *         Conflict strategy:
 *           - Customers & Invoices → CLIENT ALWAYS WINS (upsert overwrite)
 *           - Ledger entries       → APPEND-ONLY (deduplicate by clientId)
 *           - Payments             → APPEND-ONLY (deduplicate by clientId)
 *
 * @route  POST /api/sync
 * @body   { customers: [...], invoices: [...], ledger: [...], payments: [...] }
 */
exports.syncAll = async (req, res) => {
  try {
    const { customers = [], invoices = [], ledger = [], payments = [] } = req.body;
    console.log("[syncController] Incoming sync payload sizes:", {
      customers: customers.length,
      invoices: invoices.length,
      ledger: ledger.length,
      payments: payments.length,
    });
    const results = { customers: [], invoices: [], ledger: [], payments: [], errors: [] };

    // ── Sync Customers (client always wins) ───────────────────
    for (const c of customers) {
      try {
        const doc = await Customer.findOneAndUpdate(
          { clientId: c.clientId },
          {
            clientId: c.clientId,
            name: c.name,
            phone: c.phone,
            address: c.address,
            balance: c.balance || 0,
            status: c.status || "active",
          },
          { upsert: true, new: true, runValidators: true }
        );
        results.customers.push(doc);
      } catch (err) {
        results.errors.push({ type: "customer", clientId: c.clientId, error: err.message });
      }
    }

    // ── Sync Invoices (client always wins) ────────────────────
    for (const inv of invoices) {
      try {
        const doc = await Invoice.findOneAndUpdate(
          { clientId: inv.clientId },
          {
            clientId: inv.clientId,
            customerId: inv.customerId,
            invoiceType: inv.invoiceType || "selling",
            items: inv.items,
            total: inv.total,
            taxPercent: inv.taxPercent || 0,
            amountPaid: inv.amountPaid || 0,
            balanceDue: inv.balanceDue || 0,
            status: inv.status || "pending",
            notes: inv.notes || "",
            synced: true,
            whatsappSent: inv.whatsappSent || false,
          },
          { upsert: true, new: true, runValidators: true }
        );
        results.invoices.push(doc);
      } catch (err) {
        results.errors.push({ type: "invoice", clientId: inv.clientId, error: err.message });
      }
    }

    // ── Sync Ledger entries (append-only, deduplicate) ────────
    for (const entry of ledger) {
      try {
        // Only insert if this clientId doesn't exist yet
        const existing = await LedgerEntry.findOne({ clientId: entry.clientId });
        if (existing) {
          results.ledger.push(existing); // already synced
          continue;
        }

        const doc = await LedgerEntry.create({
          clientId: entry.clientId,
          customerId: entry.customerId,
          type: entry.type,
          amount: entry.amount,
          description: entry.description || "",
          source: entry.source || "invoice",
          invoiceId: entry.invoiceId || null,
        });

        // Update cached balance on customer
        // selling/credit = they owe us more (+), buying/debit = we owe them / payment (-)
        const isCredit = entry.type === "credit" || entry.type === "selling";
        const delta = isCredit ? entry.amount : -entry.amount;
        await Customer.findOneAndUpdate(
          { clientId: entry.customerId },
          { $inc: { balance: delta } }
        );

        results.ledger.push(doc);
      } catch (err) {
        results.errors.push({ type: "ledger", clientId: entry.clientId, error: err.message });
      }
    }

    // ── Sync Payments (append-only, deduplicate) ──────────────
    for (const pay of payments) {
      try {
        const existing = await Payment.findOne({ clientId: pay.clientId });
        if (existing) {
          results.payments.push(existing);
          continue;
        }

        const doc = await Payment.create({
          clientId: pay.clientId,
          customerId: pay.customerId,
          customerName: pay.customerName || "",
          invoiceId: pay.invoiceId || null,
          amount: pay.amount,
          method: pay.method || "Cash",
          note: pay.note || "",
          date: pay.date || new Date().toISOString().slice(0, 10),
          synced: true,
        });

        results.payments.push(doc);
      } catch (err) {
        results.errors.push({ type: "payment", clientId: pay.clientId, error: err.message });
      }
    }

    // ── Collect newly synced invoices that need WhatsApp ──────
    const invoicesNeedingWhatsApp = results.invoices
      .filter((inv) => inv.synced && !inv.whatsappSent)
      .map((inv) => inv.clientId);

    res.json({
      message: "Sync complete",
      synced: {
        customers: results.customers.length,
        invoices: results.invoices.length,
        ledger: results.ledger.length,
        payments: results.payments.length,
      },
      invoicesNeedingWhatsApp,
      errors: results.errors,
    });

    console.log("[syncController] ✅ Sync complete:", {
      customers: results.customers.length,
      invoices: results.invoices.length,
      ledger: results.ledger.length,
      payments: results.payments.length,
      errors: results.errors.length,
    });
  } catch (error) {
    console.error("syncAll error:", error);
    res.status(500).json({ message: "Server error during sync" });
  }
};
