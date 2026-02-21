/**
 * NanoBiz — Ledger Service
 *
 * Provides utility functions for the double-entry bookkeeping system.
 * All operations work on IndexedDB (offline-first) and queue entries
 * for sync.
 *
 * ──────────────────────────────────────────────────────────────
 * USAGE (from any page/component):
 *   import { applyCredit, applyDebit, calculateCustomerBalance } from "../services/ledgerService";
 * ──────────────────────────────────────────────────────────────
 */

import db from "../db";

/**
 * Generate a UUID v4-ish identifier for local records.
 */
function generateId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// ────────────────────────────────────────────────────────────────
// Balance calculation
// ────────────────────────────────────────────────────────────────

/**
 * Calculate a customer's balance from all their ledger entries.
 * Balance = SUM(credits) − SUM(debits)
 *
 * @param {string} customerId — the local id of the customer
 * @returns {Promise<number>} — the calculated balance
 */
export async function calculateCustomerBalance(customerId) {
  const entries = await db.ledger
    .where("customerId")
    .equals(customerId)
    .toArray();

  let balance = 0;
  for (const entry of entries) {
    if (entry.type === "credit") balance += entry.amount;
    else if (entry.type === "debit") balance -= entry.amount;
  }

  return balance;
}

/**
 * Recalculate and persist the cached balance on a customer record.
 *
 * @param {string} customerId
 * @returns {Promise<number>} — the new balance
 */
export async function recalculateAndCache(customerId) {
  const balance = await calculateCustomerBalance(customerId);
  await db.customers.update(customerId, { balance, updatedAt: new Date().toISOString() });
  return balance;
}

// ────────────────────────────────────────────────────────────────
// Credit / Debit
// ────────────────────────────────────────────────────────────────

/**
 * Apply a CREDIT (customer owes seller).
 * Typically called when a new invoice is created.
 *
 * @param {string} customerId
 * @param {number} amount
 * @param {string} [description]
 * @param {string} [invoiceId] — optional link to the invoice
 * @returns {Promise<object>} — the created ledger entry
 */
export async function applyCredit(customerId, amount, description = "", invoiceId = null) {
  const entry = {
    id: generateId(),
    customerId,
    type: "credit",
    amount,
    description: description || `Credit ₹${amount}`,
    invoiceId,
    synced: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db.ledger.add(entry);

  // Update cached balance on the customer
  const customer = await db.customers.get(customerId);
  if (customer) {
    const newBalance = (customer.balance || 0) + amount;
    await db.customers.update(customerId, {
      balance: newBalance,
      updatedAt: new Date().toISOString(),
    });
  }

  // Queue for sync
  await db.syncQueue.add({
    type: "ledger",
    recordId: entry.id,
    action: "create",
    createdAt: new Date().toISOString(),
  });

  return entry;
}

/**
 * Apply a DEBIT (payment received / seller owes customer).
 * Called when a payment is recorded or a manual adjustment is made.
 *
 * @param {string} customerId
 * @param {number} amount
 * @param {string} [description]
 * @param {string} [invoiceId]
 * @returns {Promise<object>} — the created ledger entry
 */
export async function applyDebit(customerId, amount, description = "", invoiceId = null) {
  const entry = {
    id: generateId(),
    customerId,
    type: "debit",
    amount,
    description: description || `Payment ₹${amount}`,
    invoiceId,
    synced: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db.ledger.add(entry);

  // Update cached balance on the customer
  const customer = await db.customers.get(customerId);
  if (customer) {
    const newBalance = (customer.balance || 0) - amount;
    await db.customers.update(customerId, {
      balance: newBalance,
      updatedAt: new Date().toISOString(),
    });
  }

  // Queue for sync
  await db.syncQueue.add({
    type: "ledger",
    recordId: entry.id,
    action: "create",
    createdAt: new Date().toISOString(),
  });

  return entry;
}

// ────────────────────────────────────────────────────────────────
// Ledger queries
// ────────────────────────────────────────────────────────────────

/**
 * Get all ledger entries for a customer, newest first.
 *
 * @param {string} customerId
 * @returns {Promise<Array>}
 */
export async function getCustomerLedger(customerId) {
  const entries = await db.ledger
    .where("customerId")
    .equals(customerId)
    .toArray();

  return entries.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

/**
 * Get top debtors — customers with the highest positive balance.
 *
 * @param {number} [limit=5]
 * @returns {Promise<Array<{ id, name, phone, balance }>>}
 */
export async function getTopDebtors(limit = 5) {
  const customers = await db.customers.toArray();
  return customers
    .filter((c) => (c.balance || 0) > 0)
    .sort((a, b) => (b.balance || 0) - (a.balance || 0))
    .slice(0, limit)
    .map((c) => ({ id: c.id, name: c.name, phone: c.phone, balance: c.balance }));
}

// ────────────────────────────────────────────────────────────────
// Universal transaction helper
// ────────────────────────────────────────────────────────────────

/**
 * applyTransaction — single entry point for all ledger + balance ops.
 *
 * Maps the `type` to credit/debit direction:
 *   selling / credit  → customer owes us more  (+balance / +amountOwed)
 *   buying / debit    → payment or purchase     (−balance / −amountOwed)
 *
 * @param {object} opts
 * @param {string}  opts.customerId
 * @param {number}  opts.amount      – positive value
 * @param {"selling"|"buying"|"credit"|"debit"} opts.type
 * @param {string}  [opts.invoiceId]
 * @param {string}  [opts.description]
 * @param {"invoice"|"payment"|"manual"} [opts.source]
 * @returns {Promise<object>} the created ledger entry
 */
export async function applyTransaction({
  customerId,
  amount,
  type,
  invoiceId = null,
  description = "",
  source = "invoice",
}) {
  if (!customerId || amount == null) {
    throw new Error("applyTransaction requires customerId and amount");
  }

  const isCredit = type === "selling" || type === "credit";

  const entry = {
    clientId: `ledger-${customerId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    customerId,
    invoiceId,
    type,
    amount: Math.abs(amount),
    description: description || (isCredit ? `Credit ₹${Math.abs(amount)}` : `Debit ₹${Math.abs(amount)}`),
    source,
    synced: 0,
    createdAt: new Date().toISOString(),
  };

  await db.ledger.add(entry);

  // Update cached balances on the customer record
  const customer = await db.customers.get(customerId);
  if (customer) {
    const delta = isCredit ? Math.abs(amount) : -Math.abs(amount);
    const newBalance = (customer.balance || 0) + delta;
    const newOwed = (customer.amountOwed || 0) + delta;
    await db.customers.update(customerId, {
      balance: newBalance,
      amountOwed: newOwed,
      synced: 0,
    });
  }

  return entry;
}
