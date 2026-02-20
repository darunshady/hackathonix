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

export default db;
