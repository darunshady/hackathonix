import { useEffect, useState } from "react";
import db from "../db";

/**
 * PaymentModal — Slide-over / centered modal for recording a payment.
 *
 * Props:
 *   isOpen   — boolean
 *   onClose  — () => void
 *   onSave   — (payment) => void   called after successful save
 */

/* ── Tiny X icon ───────────────────────────────────────── */
const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

const METHODS = ["Cash", "UPI", "Bank Transfer"];

export default function PaymentModal({ isOpen, onClose, onSave }) {
  /* ── Form state ──────────────────────────────── */
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);

  const [customerId, setCustomerId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Cash");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /* ── Load customers on mount ─────────────────── */
  useEffect(() => {
    if (isOpen) {
      db.customers.toArray().then(setCustomers);
      // reset form
      setCustomerId("");
      setInvoiceId("");
      setAmount("");
      setMethod("Cash");
      setNote("");
      setDate(new Date().toISOString().slice(0, 10));
      setError("");
    }
  }, [isOpen]);

  /* ── Load invoices filtered by customer ──────── */
  useEffect(() => {
    if (!customerId) {
      setInvoices([]);
      setInvoiceId("");
      return;
    }
    db.invoices
      .where("customerId")
      .equals(customerId)
      .toArray()
      .then((all) => {
        // only show pending / partial invoices
        const relevant = all.filter(
          (inv) => inv.status === "pending" || inv.status === "partial"
        );
        setInvoices(relevant);
      });
  }, [customerId]);

  /* ── Derived ─────────────────────────────────── */
  const selectedCustomer = customers.find((c) => c.id === customerId);

  /* ── Save handler ────────────────────────────── */
  const handleSave = async () => {
    setError("");

    if (!customerId) return setError("Please select a customer.");
    if (!amount || Number(amount) <= 0) return setError("Amount must be greater than 0.");

    setSaving(true);

    try {
      const now = new Date().toISOString();
      const payment = {
        id: "PAY-" + Date.now(),
        customerId,
        customerName: selectedCustomer?.name || "",
        invoiceId: invoiceId || null,
        amount: Number(amount),
        method,
        note: note.trim(),
        date,
        createdAt: now,
        synced: 0,
      };

      // 1. Save payment
      await db.payments.add(payment);

      // 2. Create ledger entry (customer paying → debit = reduces what they owe)
      await db.ledger.add({
        clientId: `ledger-pay-${payment.id}`,
        customerId,
        invoiceId: invoiceId || null,
        type: "debit",
        amount: Number(amount),
        source: "payment",
        synced: 0,
        createdAt: now,
      });

      // 3. If linked to an invoice, update its amountPaid & status
      if (invoiceId) {
        const inv = await db.invoices.get(invoiceId);
        if (inv) {
          const newPaid = (inv.amountPaid || 0) + Number(amount);
          const newBalance = Math.max(0, (inv.total || 0) - newPaid);
          const newStatus = newBalance <= 0 ? "paid" : "partial";
          await db.invoices.update(invoiceId, {
            amountPaid: newPaid,
            balanceDue: newBalance,
            status: newStatus,
          });
        }
      }

      // 3b. Update cached customer balance (payment reduces what they owe)
      const cust = await db.customers.get(customerId);
      if (cust) {
        const newOwed = Math.max(0, (cust.amountOwed || 0) - Number(amount));
        await db.customers.update(customerId, { amountOwed: newOwed, synced: 0 });
      }

      // 4. Queue for sync
      await db.syncQueue.add({
        type: "payment",
        recordId: payment.id,
        action: "create",
        createdAt: now,
      });

      onSave(payment);
      onClose();
    } catch (err) {
      console.error("Payment save failed:", err);
      setError("Failed to save payment. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal card */}
      <div className="relative bg-white w-full max-w-lg mx-4 rounded-2xl shadow-xl overflow-hidden animate-fade-in">
        {/* ── Header ──────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Record Payment</h2>
            <p className="text-xs text-gray-400">Enter payment details below</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        {/* ── Body ────────────────────────────── */}
        <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Error banner */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Customer */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-600">
              Customer <span className="text-red-400">*</span>
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#229799]/30 focus:border-[#229799] transition-shadow"
            >
              <option value="">Select a customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Invoice (optional, filtered by customer) */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-600">
              Invoice <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <select
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
              disabled={!customerId}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#229799]/30 focus:border-[#229799]
                         disabled:bg-gray-50 disabled:text-gray-400 transition-shadow"
            >
              <option value="">No specific invoice</option>
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.id} — ₹{Number(inv.total || 0).toLocaleString("en-IN")}{" "}
                  (Due: ₹{Number(inv.balanceDue || inv.total || 0).toLocaleString("en-IN")})
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-600">
              Amount (₹) <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-sm text-gray-400">
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#229799]/30 focus:border-[#229799] transition-shadow"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-600">Payment Method</label>
            <div className="flex rounded-xl border border-gray-200 overflow-hidden">
              {METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                    method === m
                      ? "bg-[#229799] text-white"
                      : "bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-600">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#229799]/30 focus:border-[#229799] transition-shadow"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-600">
              Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add any notes…"
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none
                         placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#229799]/30
                         focus:border-[#229799] transition-shadow"
            />
          </div>
        </div>

        {/* ── Footer ──────────────────────────── */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-600 text-sm font-medium
                       hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-[#229799] hover:bg-[#1b7f81] text-white text-sm font-medium
                       transition-colors shadow-sm disabled:opacity-60"
          >
            {saving ? "Saving…" : "Confirm Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}
