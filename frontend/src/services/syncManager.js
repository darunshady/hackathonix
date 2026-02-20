import db from "../db";
import api from "./api";

/**
 * SyncManager — the heart of offline-first.
 *
 * Responsibilities:
 *  1. Queue pending records when the device is offline.
 *  2. Detect connectivity changes via `navigator.onLine` + events.
 *  3. Automatically push all queued records to the backend when
 *     the connection is restored.
 */

// ────────────────────────────────────────────────────────────────
// Queue helpers
// ────────────────────────────────────────────────────────────────

/**
 * Add an entry to the offline sync queue.
 * @param {"customer"|"invoice"} type
 * @param {string} recordId  – local UUID of the record
 * @param {"create"|"update"} action
 */
export async function enqueue(type, recordId, action = "create") {
  await db.syncQueue.add({
    type,
    recordId,
    action,
    createdAt: new Date().toISOString(),
  });
}

/**
 * Return all pending queue entries (oldest first).
 */
export async function getPendingQueue() {
  return db.syncQueue.orderBy("queueId").toArray();
}

// ────────────────────────────────────────────────────────────────
// Sync logic
// ────────────────────────────────────────────────────────────────

/**
 * Push all un-synced customers & invoices to the backend via
 * the bulk `/api/sync` endpoint, then clear the local queue
 * and mark records as synced.
 *
 * @returns {{ ok: boolean, synced: object, errors: array }}
 */
export async function syncNow() {
  // Gather un-synced records from IndexedDB
  const unsyncedCustomers = await db.customers.where("synced").equals(0).toArray();
  const unsyncedInvoices = await db.invoices.where("synced").equals(0).toArray();

  if (unsyncedCustomers.length === 0 && unsyncedInvoices.length === 0) {
    return { ok: true, synced: { customers: 0, invoices: 0 }, errors: [] };
  }

  try {
    // Map local records to the shape the backend expects
    const payload = {
      customers: unsyncedCustomers.map((c) => ({
        clientId: c.id,
        name: c.name,
        phone: c.phone,
        address: c.address,
      })),
      invoices: unsyncedInvoices.map((inv) => ({
        clientId: inv.id,
        customerId: inv.customerId,
        items: inv.items,
        total: inv.total,
        status: inv.status,
      })),
    };

    const { data } = await api.post("/sync", payload);

    // Mark local records as synced
    await Promise.all(
      unsyncedCustomers.map((c) => db.customers.update(c.id, { synced: 1 }))
    );
    await Promise.all(
      unsyncedInvoices.map((inv) => db.invoices.update(inv.id, { synced: 1 }))
    );

    // Clear the queue
    await db.syncQueue.clear();

    return { ok: true, synced: data.synced, errors: data.errors };
  } catch (err) {
    console.error("[SyncManager] sync failed:", err);
    return { ok: false, synced: { customers: 0, invoices: 0 }, errors: [err.message] };
  }
}

// ────────────────────────────────────────────────────────────────
// Auto-sync on reconnect
// ────────────────────────────────────────────────────────────────

let _listening = false;

/**
 * Start listening for connectivity changes.
 * Call once at app startup (e.g. in main.jsx or App.jsx).
 * When the browser fires the `online` event we automatically
 * attempt a sync.
 *
 * @param {(result) => void} [onSyncComplete] – optional callback
 */
export function startAutoSync(onSyncComplete) {
  if (_listening) return;
  _listening = true;

  const handleOnline = async () => {
    console.log("[SyncManager] Connection restored — syncing…");
    const result = await syncNow();
    if (onSyncComplete) onSyncComplete(result);
  };

  window.addEventListener("online", handleOnline);

  // Also try an immediate sync if we're already online at startup
  if (navigator.onLine) {
    syncNow().then((result) => {
      if (onSyncComplete) onSyncComplete(result);
    });
  }
}
