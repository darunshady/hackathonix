// ── Dummy top debtors data ────────────────────────────────────
const TOP_DEBTORS = [
  { name: "Elon Mask",   amount: 1000 },
  { name: "James Brown", amount: 800 },
  { name: "Henry Cavil", amount: 550 },
  { name: "Jane Doe",    amount: 300 },
];

/**
 * TopDebtors — Right-panel list showing customers with the
 * highest pending amounts.
 */
export default function TopDebtors() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Debtors</h3>

      <div className="flex flex-col gap-2">
        {TOP_DEBTORS.map((d, i) => (
          <div
            key={i}
            className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3"
          >
            {/* Name */}
            <span className="text-sm font-medium text-gray-700">{d.name}</span>

            {/* Amount */}
            <span className="text-sm font-bold text-amber-600">
              ₹{d.amount.toLocaleString("en-IN")}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center mt-4">Last 6 months</p>
    </div>
  );
}
