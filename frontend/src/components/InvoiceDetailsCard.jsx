/**
 * InvoiceDetailsCard — Right card with customer selector,
 * auto-filled phone, date, payment toggle, notes, and sync badge.
 *
 * Props:
 *   customers       — [{ id, name, phone }]
 *   customerId      — selected customer id
 *   onCustomerChange — (id) => void
 *   phone           — auto-filled phone string
 *   invoiceDate     — string (YYYY-MM-DD)
 *   onDateChange    — (value) => void
 *   paymentStatus   — "paid" | "credit"
 *   onPaymentToggle — (status) => void
 *   amountPaid      — number | string
 *   onAmountPaidChange — (value) => void
 *   grandTotal      — number (invoice grand total for balance calc)
 *   notes           — string
 *   onNotesChange   — (value) => void
 *   online          — boolean
 *   syncLabel       — "Online" | "Offline" | "Pending Sync"
 */

/* ── Badge style map ───────────────────────────────────── */
const SYNC_STYLES = {
  Online:       "bg-green-100 text-green-600",
  Offline:      "bg-yellow-100 text-yellow-700",
  "Pending Sync": "bg-amber-100 text-amber-600",
};

/* ── Tiny icons ────────────────────────────────────────── */
const CalendarIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
  </svg>
);

export default function InvoiceDetailsCard({
  customers,
  customerId,
  onCustomerChange,
  phone,
  invoiceDate,
  onDateChange,
  paymentStatus,
  onPaymentToggle,
  amountPaid,
  onAmountPaidChange,
  grandTotal = 0,
  notes,
  onNotesChange,
  syncLabel = "Online",
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5 h-fit">
      <h2 className="text-lg font-bold text-gray-800">Invoice Details</h2>

      {/* ── Customer dropdown ──────────────────── */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-600">Customer</label>
        <select
          value={customerId}
          onChange={(e) => onCustomerChange(e.target.value)}
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

      {/* ── Auto-filled Phone ─────────────────── */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-600">Phone Number</label>
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <PhoneIcon />
          </span>
          <input
            type="text"
            readOnly
            value={phone || "—"}
            className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm bg-gray-50 text-gray-600"
          />
        </div>
      </div>

      {/* ── Invoice Date ──────────────────────── */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-600">Invoice Date</label>
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <CalendarIcon />
          </span>
          <input
            type="date"
            value={invoiceDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-[#229799]/30 focus:border-[#229799] transition-shadow"
          />
        </div>
      </div>

      {/* ── Payment Status Toggle ─────────────── */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-600">Payment Status</label>
        <div className="flex rounded-xl border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() => onPaymentToggle("paid")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              paymentStatus === "paid"
                ? "bg-[#229799] text-white"
                : "bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            Paid
          </button>
          <button
            type="button"
            onClick={() => onPaymentToggle("credit")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              paymentStatus === "credit"
                ? "bg-amber-500 text-white"
                : "bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            Credit (Pending)
          </button>
        </div>
      </div>

      {/* ── Amount Paid (only for Credit/Pending) ── */}
      {paymentStatus === "credit" && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-600">Amount Paid (₹)</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-sm text-gray-400">₹</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              value={amountPaid}
              onChange={(e) => onAmountPaidChange(e.target.value)}
              className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#229799]/30 focus:border-[#229799] transition-shadow"
            />
          </div>
          {/* Balance due */}
          {grandTotal > 0 && (
            <div className={`flex items-center justify-between text-xs mt-1 px-1 ${
              grandTotal - Number(amountPaid || 0) > 0 ? "text-amber-600" : "text-green-600"
            }`}>
              <span>Balance due</span>
              <span className="font-semibold">
                ₹{Math.max(0, grandTotal - Number(amountPaid || 0)).toLocaleString("en-IN")}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Notes ─────────────────────────────── */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-600">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Add any additional notes…"
          rows={3}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none
                     placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#229799]/30 focus:border-[#229799]
                     transition-shadow"
        />
      </div>

      {/* ── Sync Status Badge ─────────────────── */}
      <div className="pt-2">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
            SYNC_STYLES[syncLabel] || SYNC_STYLES.Online
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-current opacity-70" />
          {syncLabel}
        </span>
      </div>
    </div>
  );
}
