import { useEffect, useState } from "react";
import db from "../db";
import { sendWhatsAppInvoice } from "../services/whatsapp";

/**
 * Invoice List page — view all invoices with sync status and actions.
 */
export default function InvoiceList() {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState({});

  useEffect(() => {
    async function load() {
      const allInvoices = await db.invoices.orderBy("createdAt").reverse().toArray();
      setInvoices(allInvoices);

      // Build a customer lookup map for display
      const allCustomers = await db.customers.toArray();
      const map = {};
      allCustomers.forEach((c) => (map[c.id] = c));
      setCustomers(map);
    }
    load();
  }, []);

  // ── Toggle paid / pending ────────────────────────────
  const toggleStatus = async (invoice) => {
    const newStatus = invoice.status === "paid" ? "pending" : "paid";
    await db.invoices.update(invoice.id, { status: newStatus, synced: 0 });
    setInvoices((prev) =>
      prev.map((i) => (i.id === invoice.id ? { ...i, status: newStatus, synced: 0 } : i))
    );
  };

  // ── WhatsApp placeholder ─────────────────────────────
  const handleWhatsApp = (invoice) => {
    const customer = customers[invoice.customerId];
    if (!customer?.phone) {
      alert("This customer has no phone number on file.");
      return;
    }
    sendWhatsAppInvoice(customer.phone, invoice);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Invoices</h1>

      {invoices.length === 0 ? (
        <p className="text-slate-400 text-sm">
          No invoices yet.{" "}
          <a href="/invoices/new" className="text-indigo-400 hover:underline">
            Create one →
          </a>
        </p>
      ) : (
        <div className="space-y-4">
          {invoices.map((inv) => {
            const customer = customers[inv.customerId];
            return (
              <div
                key={inv.id}
                className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* ── Info ──────────────────────── */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">
                      {customer ? customer.name : "Unknown Customer"}
                    </h3>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        inv.status === "paid"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {inv.status}
                    </span>
                    {!inv.synced && (
                      <span className="text-xs text-red-400 font-medium">⏳ Not synced</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400">
                    {inv.items.length} item{inv.items.length !== 1 ? "s" : ""} ·{" "}
                    <span className="text-white font-medium">₹{inv.total.toLocaleString()}</span>{" "}
                    · {new Date(inv.createdAt).toLocaleDateString()}
                  </p>
                  <ul className="mt-2 text-xs text-slate-500 space-y-0.5">
                    {inv.items.map((item, i) => (
                      <li key={i}>
                        {item.name} × {item.qty} @ ₹{item.price}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* ── Actions ──────────────────── */}
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleStatus(inv)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      inv.status === "paid"
                        ? "bg-amber-600 hover:bg-amber-700 text-white"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                    }`}
                  >
                    {inv.status === "paid" ? "Mark Pending" : "Mark Paid"}
                  </button>

                  <button
                    onClick={() => handleWhatsApp(inv)}
                    className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    📱 WhatsApp
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
