import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ── Dummy revenue data (last 6 months) ───────────────────────
const CHART_DATA = [
  { month: "Sep", revenue: 3200 },
  { month: "Oct", revenue: 4100 },
  { month: "Nov", revenue: 3800 },
  { month: "Dec", revenue: 6200 },
  { month: "Jan", revenue: 7500 },
  { month: "Feb", revenue: 12500 },
];

// ── Dummy recent invoices ────────────────────────────────────
const RECENT_INVOICES = [
  { id: "#INV-007", customer: "Raj Patel",   date: "2024-03-10", amount: 500,  status: "Paid" },
  { id: "#INV-006", customer: "Wei Chen",    date: "2024-03-08", amount: 300,  status: "Paid" },
  { id: "#INV-005", customer: "Elon Mask",   date: "2024-03-05", amount: 250,  status: "Paid" },
  { id: "#INV-004", customer: "James Brown", date: "2024-03-02", amount: 1200, status: "Pending" },
  { id: "#INV-003", customer: "Henry Cavil", date: "2024-02-28", amount: 750,  status: "Pending" },
];

/**
 * Custom Recharts tooltip with #229799 accent.
 */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="text-gray-500 text-xs mb-0.5">{label}</p>
      <p className="font-semibold text-[#229799]">₹{payload[0].value.toLocaleString("en-IN")}</p>
    </div>
  );
}

/**
 * RevenueChart — Area chart showing 6-month revenue growth,
 * plus a recent-invoices mini-table underneath.
 */
export default function RevenueChart() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
      {/* ── Header ────────────────────────────────── */}
      <h3 className="text-lg font-semibold text-[#229799] mb-4">Revenue Growth</h3>

      {/* ── Chart ─────────────────────────────────── */}
      <div className="w-full h-52">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={CHART_DATA} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#229799" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#229799" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#229799"
              strokeWidth={2.5}
              fill="url(#revenueGrad)"
              dot={false}
              activeDot={{ r: 5, fill: "#229799", stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-gray-400 text-center mt-1 mb-4">Last 6 months</p>

      {/* ── Recent Invoices Mini-Table ─────────────── */}
      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-[#229799] font-semibold border-b border-gray-100">
              <th className="text-left px-2 py-2">Invoice ID</th>
              <th className="text-left px-2 py-2">Customer</th>
              <th className="text-left px-2 py-2">Date</th>
              <th className="text-right px-2 py-2">Amount</th>
              <th className="text-center px-2 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="text-gray-600">
            {RECENT_INVOICES.map((inv) => (
              <tr key={inv.id} className="border-b border-gray-50 last:border-0">
                <td className="px-2 py-2 font-medium text-gray-700">{inv.id}</td>
                <td className="px-2 py-2">{inv.customer}</td>
                <td className="px-2 py-2 text-gray-400">{inv.date}</td>
                <td className="px-2 py-2 text-right font-medium">₹{inv.amount.toLocaleString("en-IN")}</td>
                <td className="px-2 py-2 text-center">
                  <span
                    className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      inv.status === "Paid"
                        ? "bg-red-100 text-red-500"
                        : "bg-amber-100 text-amber-600"
                    }`}
                  >
                    {inv.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
