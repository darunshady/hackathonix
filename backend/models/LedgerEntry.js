const mongoose = require("mongoose");

/**
 * LedgerEntry Schema — double-entry bookkeeping for NanoBiz.
 *
 * Every financial event (invoice created, payment received, manual
 * adjustment) produces ONE ledger entry per invoice.
 *
 *  CREDIT  →  customer owes seller  (e.g. new invoice)
 *  DEBIT   →  seller owes customer / payment received
 *
 * Customer balance = SUM(credits) − SUM(debits)
 *
 * Ledger entries are APPEND-ONLY — they are never edited or deleted.
 * Conflicts are resolved by deduplication on `clientId`.
 */
const ledgerEntrySchema = new mongoose.Schema(
  {
    clientId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    customerId: {
      type: String,
      required: [true, "Customer reference is required"],
      index: true,
    },
    type: {
      type: String,
      enum: ["credit", "debit", "selling", "buying"],
      required: [true, "Ledger type is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: 0,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    source: {
      type: String,
      trim: true,
      default: "invoice",
    },
    invoiceId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("LedgerEntry", ledgerEntrySchema);
