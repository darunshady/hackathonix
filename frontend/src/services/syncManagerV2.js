/**
 * NanoBiz — Sync Manager V2
 *
 * Upgraded sync manager with:
 *  - Ledger entry sync support
 *  - Event-driven triggers (online, manual, new-record)
 *  - Retry logic with exponential backoff
 *  - Post-sync WhatsApp auto-send
 *  - Client Always Wins conflict resolution
 *
 * ──────────────────────────────────────────────────────────────
 * USAGE:
 *   import { syncNow, startAutoSync, triggerSync, enqueueSyncItem } from "../services/syncManagerV2";
 *
 *   // At app startup:
 *   startAutoSync();
 *
 *   // After creating a record offline:
 *   enqueueSyncItem("invoice", invoiceId);
 *
 *   // Manual sync button:
 *   await triggerSync();
 * ──────────────────────────────────────────────────────────────
 *
 * NOTE: This is a NEW file. The original syncManager.js is
 *       untouched. Your friends can keep importing from the old one.
 *       When ready, switch imports to syncManagerV2.
 */

import db from "../db/schema";
import { bulkSync, sendWhatsApp } from "./apiService";

// ────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 2000; // 2s, 4s, 8s, 16s, 32s

// ────────────────────────────────────────────────────────────────
// Queue helpers
// ────────────────────────────────────────────────────────────────

/**
 * Add an item to the sync queue.
 * Call this whenever a record is created or updated offline.
 *
 * @param {"customer"|"invoice"|"ledger"} type
 * @param {string} recordId — local UUID of the record
 * @param {"create"|"update"} [action="create"]
 */
export async function enqueueSyncItem(type, recordId, action = "create") {
  await db.syncQueue.add({
    type,
    recordId,
    action,
    createdAt: new Date().toISOString(),
  });

  // If we're online, trigger sync immediately
  if (navigator.onLine) {
    // Debounced — wait a tick so multiple enqueues batch together
    clearTimeout(_syncTimer);
    _syncTimer = setTimeout(() => syncNow(), 300);
  }
}

let _syncTimer = null;

// ────────────────────────────────────────────────────────────────
// Core sync logic
// ────────────────────────────────────────────────────────────────

let _syncing = false;
let _retryCount = 0;

/**
 * Internal listeners that get notified after each sync.
 * @type {Set<(result: object) => void>}
 */
const _listeners = new Set();

/**
 * Register a callback that fires after every sync attempt.
 * Returns an unsubscribe function.
 */
export function onSyncComplete(callback) {
  _listeners.add(callback);
  return () => _listeners.delete(callback);
}

/**
 * Push all un-synced customers, invoices, and ledger entries
 * to the backend via the bulk /api/sync endpoint, then mark
 * local records as synced and trigger WhatsApp for eligible invoices.
 *
 * @returns {Promise<{ ok: boolean, synced: object, errors: array }>}
 */
export async function syncNow() {
  if (_syncing) return { ok: false, synced: {}, errors: ["Sync already in progress"] };
  if (!navigator.onLine) return { ok: false, synced: {}, errors: ["Device is offline"] };

  _syncing = true;

  try {
    // ── Gather unsynced records from IndexedDB ──────────────
    const unsyncedCustomers = await db.customers.where("synced").equals(0).toArray();
    const unsyncedInvoices = await db.invoices.where("synced").equals(0).toArray();
    const unsyncedLedger = await db.ledger.where("synced").equals(0).toArray();

    if (
      unsyncedCustomers.length === 0 &&
      unsyncedInvoices.length === 0 &&
      unsyncedLedger.length === 0
    ) {
      _syncing = false;
      _retryCount = 0;
      return { ok: true, synced: { customers: 0, invoices: 0, ledger: 0 }, errors: [] };
    }

    // ── Build payload ───────────────────────────────────────
    const payload = {
      customers: unsyncedCustomers.map((c) => ({
        clientId: c.id,
        name: c.name,
        phone: c.phone,
        address: c.address,
        balance: c.balance || 0,
        status: c.status || "active",
      })),
      invoices: unsyncedInvoices.map((inv) => ({
        clientId: inv.id,
        customerId: inv.customerId,
        items: inv.items,
        total: inv.total,
        status: inv.status,
        whatsappSent: inv.whatsappSent || false,
      })),
      ledger: unsyncedLedger.map((entry) => ({
        clientId: entry.id,
        customerId: entry.customerId,
        type: entry.type,
        amount: entry.amount,
        description: entry.description,
        invoiceId: entry.invoiceId,
      })),
    };

    // ── Send to backend ─────────────────────────────────────
    const data = await bulkSync(payload);

    // ── Mark local records as synced ────────────────────────
    await Promise.all(
      unsyncedCustomers.map((c) => db.customers.update(c.id, { synced: 1 }))
    );
    await Promise.all(
      unsyncedInvoices.map((inv) => db.invoices.update(inv.id, { synced: 1 }))
    );
    await Promise.all(
      unsyncedLedger.map((entry) => db.ledger.update(entry.id, { synced: 1 }))
    );

    // ── Clear processed queue entries ───────────────────────
    await db.syncQueue.clear();

    // ── Auto-send WhatsApp for newly synced invoices ────────
    if (data.invoicesNeedingWhatsApp && data.invoicesNeedingWhatsApp.length > 0) {
      for (const invoiceClientId of data.invoicesNeedingWhatsApp) {
        try {
          const result = await sendWhatsApp(invoiceClientId);
          // Update local record
          const localInv = await db.invoices.where("id").equals(invoiceClientId).first();
          if (localInv) {
            await db.invoices.update(localInv.id, { whatsappSent: true });
          }
          console.log(`[Sync] WhatsApp sent for invoice ${invoiceClientId}:`, result.url);
        } catch (waErr) {
          console.warn(`[Sync] WhatsApp failed for ${invoiceClientId}:`, waErr.message);
          // Non-fatal — invoice is still synced, WhatsApp can be retried
        }
      }
    }

    _retryCount = 0;

    const result = {
      ok: true,
      synced: data.synced,
      errors: data.errors || [],
    };

    _listeners.forEach((cb) => cb(result));
    return result;
  } catch (err) {
    console.error("[SyncManager V2] sync failed:", err);

    const result = {
      ok: false,
      synced: { customers: 0, invoices: 0, ledger: 0 },
      errors: [err.message],
    };

    _listeners.forEach((cb) => cb(result));

    // ── Retry with exponential backoff ──────────────────────
    if (_retryCount < MAX_RETRIES && navigator.onLine) {
      _retryCount++;
      const delay = BASE_DELAY_MS * Math.pow(2, _retryCount - 1);
      console.log(`[SyncManager V2] Retrying in ${delay}ms (attempt ${_retryCount}/${MAX_RETRIES})`);
      setTimeout(() => syncNow(), delay);
    }

    return result;
  } finally {
    _syncing = false;
  }
}

// ────────────────────────────────────────────────────────────────
// Public triggers
// ────────────────────────────────────────────────────────────────

/**
 * Manually trigger a sync (e.g. from a Sync button).
 * Resets retry counter so it starts fresh.
 */
export async function triggerSync() {
  _retryCount = 0;
  return syncNow();
}

// ────────────────────────────────────────────────────────────────
// Auto-sync on reconnect
// ────────────────────────────────────────────────────────────────

let _listening = false;

/**
 * Start listening for connectivity changes.
 * Call once at app startup (e.g. in main.jsx or App.jsx).
 *
 * Events that trigger sync:
 *  1. Browser `online` event (network reconnect)
 *  2. App startup (if already online)
 *
 * @param {(result: object) => void} [callback] — optional listener
 */
export function startAutoSync(callback) {
  if (_listening) return;
  _listening = true;

  if (callback) _listeners.add(callback);

  const handleOnline = () => {
    console.log("[SyncManager V2] Connection restored — syncing…");
    _retryCount = 0;
    syncNow();
  };

  window.addEventListener("online", handleOnline);

  // Also try an immediate sync if we're already online at startup
  if (navigator.onLine) {
    syncNow();
  }
}

/**
 * Get sync status information for UI display.
 */
export async function getSyncStatus() {
  const pendingCustomers = await db.customers.where("synced").equals(0).count();
  const pendingInvoices = await db.invoices.where("synced").equals(0).count();
  const pendingLedger = await db.ledger.where("synced").equals(0).count();
  const queueSize = await db.syncQueue.count();

  return {
    online: navigator.onLine,
    syncing: _syncing,
    pending: {
      customers: pendingCustomers,
      invoices: pendingInvoices,
      ledger: pendingLedger,
      total: pendingCustomers + pendingInvoices + pendingLedger,
    },
    queueSize,
  };
}
