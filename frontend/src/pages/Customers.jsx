import { useEffect, useState } from "react";
import db from "../db";
import { enqueue } from "../services/syncManager";

/**
 * Customers page — view all customers and add new ones.
 */
export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ name: "", phone: "", address: "" });

  // Load customers from IndexedDB on mount
  const loadCustomers = async () => {
    const all = await db.customers.orderBy("name").toArray();
    setCustomers(all);
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  // ── Handle form submission ──────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const newCustomer = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      synced: navigator.onLine ? 1 : 0, // 1 = synced, 0 = pending
      createdAt: new Date().toISOString(),
    };

    // Store locally first (offline-first)
    await db.customers.add(newCustomer);

    // Queue for sync if offline
    if (!navigator.onLine) {
      await enqueue("customer", newCustomer.id, "create");
    } else {
      // Try to sync immediately
      try {
        const { default: api } = await import("../services/api");
        await api.post("/customers", {
          clientId: newCustomer.id,
          name: newCustomer.name,
          phone: newCustomer.phone,
          address: newCustomer.address,
        });
        await db.customers.update(newCustomer.id, { synced: 1 });
      } catch {
        // If the API call fails, queue for later
        await enqueue("customer", newCustomer.id, "create");
        await db.customers.update(newCustomer.id, { synced: 0 });
      }
    }

    setForm({ name: "", phone: "", address: "" });
    loadCustomers();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Customers</h1>

      {/* ── Add Customer Form ──────────────────── */}
      <form
        onSubmit={handleSubmit}
        className="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-8 grid grid-cols-1 sm:grid-cols-4 gap-4"
      >
        <input
          type="text"
          placeholder="Name *"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm
                     placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <input
          type="text"
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm
                     placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <input
          type="text"
          placeholder="Address"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm
                     placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        >
          Add Customer
        </button>
      </form>

      {/* ── Customer List ──────────────────────── */}
      {customers.length === 0 ? (
        <p className="text-slate-400 text-sm">No customers yet. Add one above!</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-800 text-slate-400 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3">Synced</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3">{c.phone || "—"}</td>
                  <td className="px-4 py-3">{c.address || "—"}</td>
                  <td className="px-4 py-3">
                    {c.synced ? (
                      <span className="text-emerald-400 text-xs font-semibold">✓ Synced</span>
                    ) : (
                      <span className="text-amber-400 text-xs font-semibold">⏳ Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
