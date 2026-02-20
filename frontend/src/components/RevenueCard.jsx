/**
 * RevenueCard — Total Sales Overview card with paid/pending breakdown,
 * expenses, and net profit calculation.
 */
export default function RevenueCard({
  paidAmount = 10000,
  pendingAmount = 2500,
  expenses = null, // null = not yet available
}) {
  const totalSales = paidAmount + pendingAmount;
  const netProfit = expenses !== null ? totalSales - expenses : null;

  const fmt = (n) =>
    `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 flex flex-col gap-4">
      {/* ── Top Section ─────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Total Sales Overview
          </p>
          <p className="text-3xl font-bold text-gray-800 mt-1 leading-tight">
            {fmt(totalSales)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Calculated from Paid + Pending invoices
          </p>
        </div>

        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center">
          <svg
            className="w-5 h-5 text-[#229799]"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </div>
      </div>

      {/* ── Divider ─────────────────────────────────── */}
      <hr className="border-gray-100" />

      {/* ── Breakdown Section ───────────────────────── */}
      <div className="space-y-3">
        {/* Paid */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm text-gray-500">Paid</span>
          </div>
          <span className="text-sm font-semibold text-green-600">
            {fmt(paidAmount)}
          </span>
        </div>

        {/* Pending */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-sm text-gray-500">Pending</span>
          </div>
          <span className="text-sm font-semibold text-amber-600">
            {fmt(pendingAmount)}
          </span>
        </div>
      </div>

      {/* ── Divider ─────────────────────────────────── */}
      <hr className="border-gray-100" />

      {/* ── Expense & Profit Section ────────────────── */}
      <div className="space-y-3">
        {expenses !== null ? (
          <>
            {/* Total Expenses */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Total Expenses</span>
              <span className="text-sm font-semibold text-red-500">
                {fmt(expenses)}
              </span>
            </div>

            {/* Net Profit */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">
                Net Profit
              </span>
              <span
                className={`text-sm font-semibold ${
                  netProfit >= 0 ? "text-green-700" : "text-red-600"
                }`}
              >
                {netProfit >= 0 ? fmt(netProfit) : `- ${fmt(Math.abs(netProfit))}`}
              </span>
            </div>
          </>
        ) : (
          <p className="text-xs text-gray-400 italic text-center py-1">
            Expense tracking coming soon
          </p>
        )}
      </div>
    </div>
  );
}
