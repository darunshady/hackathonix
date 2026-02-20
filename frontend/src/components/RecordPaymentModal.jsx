import { useState, useEffect } from "react";

/**
 * RecordPaymentModal — centered modal for recording a payment against an invoice.
 *
 * Props:
 *   open       — boolean controlling visibility
 *   invoice    — the invoice object being paid
 *   onClose    — () => void
 *   onSave     — (paymentData) => void
 */
export default function RecordPaymentModal({ open, invoice, onClose, onSave }) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Cash");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  // Reset form when invoice changes
  useEffect(() => {
    if (invoice) {
      setAmount("");
      setMethod("Cash");
      setDate(new Date().toISOString().slice(0, 10));
      setNote("");
      setError("");
    }
  }, [invoice]);

  if (!open || !invoice) return null;

  const remaining = (invoice.amount ?? 0) - (invoice.amountPaid ?? 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    const num = Number(amount);

    if (!num || num <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    if (num > remaining) {
      setError(`Amount exceeds remaining balance of ₹${remaining.toLocaleString("en-IN")}.`);
      return;
    }

    setError("");
    onSave({
      invoiceId: invoice.id,
      customerName: invoice.customerName,
      phone: invoice.phone,
      amount: num,
      method,
      date,
      note: note.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md mx-4 bg-white rounded-xl shadow-lg overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Record Payment</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {invoice.id} · {invoice.customerName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Invoice summary */}
          <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
            <div>
              <p className="text-xs text-gray-400">Invoice Total</p>
              <p className="text-sm font-semibold text-gray-800">
                ₹{(invoice.amount ?? 0).toLocaleString("en-IN")}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Already Paid</p>
              <p className="text-sm font-semibold text-green-600">
                ₹{(invoice.amountPaid ?? 0).toLocaleString("en-IN")}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Remaining</p>
              <p className="text-sm font-semibold text-amber-600">
                ₹{remaining.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* Payment Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Payment Amount (₹) *</label>
            <input
              type="number"
              min="1"
              max={remaining}
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Max ₹${remaining.toLocaleString("en-IN")}`}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                         placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#229799]/40 focus:border-[#229799]"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Payment Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700
                         focus:outline-none focus:ring-2 focus:ring-[#229799]/40 focus:border-[#229799] cursor-pointer"
            >
              <option>Cash</option>
              <option>UPI</option>
              <option>Bank Transfer</option>
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700
                         focus:outline-none focus:ring-2 focus:ring-[#229799]/40 focus:border-[#229799]"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Note (optional)</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Partial payment via UPI"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none
                         placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#229799]/40 focus:border-[#229799]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-600 rounded-lg px-4 py-2 text-sm font-medium
                       hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 bg-[#229799] hover:bg-[#1b7f81] text-white rounded-lg px-4 py-2 text-sm font-medium
                       transition-colors"
          >
            Save Payment
          </button>
        </div>
      </form>
    </div>
  );
}
