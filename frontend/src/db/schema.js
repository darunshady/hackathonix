/**
 * NanoBiz — Extended IndexedDB Schema (v2)
 *
 * This module upgrades the Dexie database to include the `ledger` table
 * for double-entry bookkeeping. It imports the existing db instance and
 * applies the version upgrade.
 *
 * ──────────────────────────────────────────────────────────────
 * USAGE:
 *   import db from "../db/schema";   // instead of "../db"
 *   // db now has: customers, invoices, syncQueue, ledger
 * ──────────────────────────────────────────────────────────────
 *
 * NOTE: This file does NOT modify the original db/index.js.
 *       Your friends' code importing from "../db" still works.
 *       New code that needs ledger should import from "../db/schema".
 */

import Dexie from "dexie";

const db = new Dexie("NanoBizDB");

// Version 1: original tables (must stay for Dexie upgrade path)
db.version(1).stores({
  customers: "phone, name, id, synced",
  invoices: "id, customerId, status, synced",
  syncQueue: "++queueId, type, recordId, action, createdAt",
});

// Version 2: add ledger table + balance/status on customers + whatsappSent on invoices
db.version(2).stores({
  customers: "phone, name, id, balance, status, synced",
  invoices: "id, customerId, status, synced, whatsappSent",
  syncQueue: "++queueId, type, recordId, action, createdAt",
  ledger: "id, customerId, type, amount, invoiceId, synced, createdAt",
});

export default db;
