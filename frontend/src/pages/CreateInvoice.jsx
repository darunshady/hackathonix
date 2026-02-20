import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import db from "../db";
import { enqueue } from "../services/syncManager";

/**
 * Create Invoice page — select a customer, add line items, save.
 */
export default function CreateInvoice() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState([{ name: "", qty: 1, price: 0 }]);

  useEffect(() => {
    db.customers.toArray().then(setCustomers);
  }, []);

  // ── Compute total ────────────────────────────────────
  const total = items.reduce((sum, i) => sum + i.qty * i.price, 0);

  // ── Item helpers ─────────────────────────────────────
  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const addItem = () => setItems([...items, { name: "", qty: 1, price: 0 }]);

  const removeItem = (index) => {
    if (items.length === 1) return; // keep at least one row
    setItems(items.filter((_, i) => i !== index));
  };

  // ── Submit ───────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerId) return alert("Please select a customer");
    if (items.some((i) => !i.name.trim())) return alert("All items need a name");

    const newInvoice = {
      id: crypto.randomUUID(),
      customerId,
      items: items.map((i) => ({
        name: i.name.trim(),
        qty: Number(i.qty),
        price: Number(i.price),
      })),
      total,
      status: "pending",
      synced: navigator.onLine ? 1 : 0,
      createdAt: new Date().toISOString(),
    };

    // Save locally first
    await db.invoices.add(newInvoice);

    if (!navigator.onLine) {
      await enqueue("invoice", newInvoice.id, "create");
    } else {
      try {
        const { default: api } = await import("../services/api");
        await api.post("/invoices", {
          clientId: newInvoice.id,
          customerId: newInvoice.customerId,
          items: newInvoice.items,
          total: newInvoice.total,
          status: newInvoice.status,
        });
        await db.invoices.update(newInvoice.id, { synced: 1 });
      } catch {
        await enqueue("invoice", newInvoice.id, "create");
        await db.invoices.update(newInvoice.id, { synced: 0 });
      }
    }

    navigate("/invoices");
  };

  // ── Placeholder: voice input ─────────────────────────
  const handleVoiceInput = () => {
    alert("🎤 Voice input coming soon!\nThis will use AI to auto-fill invoice items from speech.");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Create Invoice</h1>
        <button
          type="button"
          onClick={handleVoiceInput}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white
                     rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        >
          🎤 Voice Input
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-6"
      >
        {/* ── Customer select ──────────────── */}
        <div>
          <label className="block text-sm text-gray-500 mb-1">Customer *</label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-[#229799]/40 focus:border-[#229799]"
          >
            <option value="">Select a customer…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.phone ? `(${c.phone})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* ── Line items ───────────────────── */}
        <div>
          <label className="block text-sm text-gray-500 mb-2">Items</label>
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <input
                  type="text"
                  placeholder="Item name"
                  value={item.name}
                  onChange={(e) => updateItem(idx, "name", e.target.value)}
                  className="col-span-5 border border-gray-300 rounded-lg px-3 py-2 text-sm
                             placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#229799]/40 focus:border-[#229799]"
                />
                <input
                  type="number"
                  min="1"
                  placeholder="Qty"
                  value={item.qty}
                  onChange={(e) => updateItem(idx, "qty", e.target.value)}
                  className="col-span-2 border border-gray-300 rounded-lg px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-[#229799]/40 focus:border-[#229799]"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Price"
                  value={item.price}
                  onChange={(e) => updateItem(idx, "price", e.target.value)}
                  className="col-span-3 border border-gray-300 rounded-lg px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-[#229799]/40 focus:border-[#229799]"
                />
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="col-span-2 text-red-500 hover:text-red-600 text-sm font-medium"
                >
                  ✕ Remove
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addItem}
            className="mt-3 text-[#229799] hover:text-[#1b7f81] text-sm font-medium"
          >
            + Add Item
          </button>
        </div>

        {/* ── Total + submit ───────────────── */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <p className="text-lg font-bold text-gray-800">
            Total: <span className="text-[#229799]">₹{total.toLocaleString()}</span>
          </p>
          <button
            type="submit"
            className="bg-[#229799] hover:bg-[#1b7f81] text-white rounded-lg px-6 py-2.5 text-sm font-medium transition-colors"
          >
            Save Invoice
          </button>
        </div>
      </form>
    </div>
  );
}
