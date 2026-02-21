import Dexie from "dexie";

/**
 * NanoBiz local database powered by Dexie.js (IndexedDB wrapper).
 *
 * Stores customers, invoices, and a sync queue for offline-first support.
 * The `synced` field on records tracks whether they have been pushed
 * to the backend.  The `syncQueue` table keeps a generic log of
 * pending actions so the sync manager can replay them in order.
 */
const db = new Dexie("NanoBizDB");

db.version(1).stores({
  // ── Core tables ──────────────────────────────
  customers: "id, name, phone, synced",
  invoices: "id, customerId, status, synced",

  // ── Offline sync queue ───────────────────────
  // Auto-incrementing primary key; `type` = "customer" | "invoice"
  syncQueue: "++queueId, type, recordId, action, createdAt",
});

db.version(2).stores({
  customers: "id, name, phone, synced",
  invoices: "id, customerId, status, synced, invoiceType",

  // ── Ledger for double-entry balance tracking ─
  // Each invoice creates a ledger entry recording the
  // balance change for a customer/supplier.
  ledger: "++id, customerId, invoiceId, type, amount, createdAt",

  syncQueue: "++queueId, type, recordId, action, createdAt",
});

db.version(3).stores({
  customers: "id, name, phone, synced",
  invoices: "id, customerId, status, synced, invoiceType",
  ledger: "++id, customerId, invoiceId, type, amount, synced, createdAt",

  // ── Payments table ───────────────────────────
  payments: "id, customerId, invoiceId, method, date, synced",

  syncQueue: "++queueId, type, recordId, action, createdAt",
});

export default db;
