/**
 * PaymentTable — clean, responsive table displaying payment records.
 *
 * Props:
 *   payments — array of payment objects
 */

const METHOD_BADGE = {
  Cash:            "bg-green-100 text-green-700",
  UPI:             "bg-purple-100 text-purple-700",
  "Bank Transfer": "bg-blue-100 text-blue-700",
};

export default function PaymentTable({ payments = [] }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      {/* ── Header ──────────────────────────────── */}
      <div className="px-6 pt-5 pb-3">
        <h2 className="text-base font-semibold text-gray-800">Payment History</h2>
        <p className="text-xs text-gray-400 mt-0.5">All recorded payments across invoices</p>
      </div>

      {/* ── Table ───────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100">
              <th className="px-6 py-3 font-medium">Payment ID</th>
              <th className="px-6 py-3 font-medium">Date</th>
              <th className="px-6 py-3 font-medium">Customer Name</th>
              <th className="px-6 py-3 font-medium">Invoice ID</th>
              <th className="px-6 py-3 font-medium text-right">Amount (₹)</th>
              <th className="px-6 py-3 font-medium">Method</th>
              <th className="px-6 py-3 font-medium">Note</th>
            </tr>
          </thead>

          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-gray-400">
                  No payments recorded yet.
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-gray-800">{p.id}</td>
                  <td className="px-6 py-4 text-gray-500">{p.date}</td>
                  <td className="px-6 py-4 text-gray-700">{p.customerName}</td>
                  <td className="px-6 py-4 text-gray-500">{p.invoiceId || "—"}</td>
                  <td className="px-6 py-4 text-gray-800 font-semibold text-right">
                    ₹{Number(p.amount).toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${
                        METHOD_BADGE[p.method] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {p.method}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-xs max-w-[180px] truncate">
                    {p.note || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
