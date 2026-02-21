import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import db from "../db";

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/**
 * Custom Recharts tooltip with #229799 accent.
 */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="text-gray-500 text-xs mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="font-semibold" style={{ color: entry.color }}>
          {entry.name}: ₹{entry.value.toLocaleString("en-IN")}
        </p>
      ))}
    </div>
  );
}

/**
 * RevenueChart — Area chart showing 6-month revenue growth from real data,
 * plus a recent-invoices mini-table underneath (live from IndexedDB).
 */
export default function RevenueChart() {
  const [chartData, setChartData] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const location = useLocation();

  useEffect(() => {
    (async () => {
      try {
        const allInvoices = await db.invoices.toArray();
        const allCustomers = await db.customers.toArray();
        const custMap = Object.fromEntries(allCustomers.map(c => [c.id, c.name]));

        // Fetch standalone payments too
        let allPayments = [];
        try { allPayments = await db.payments.toArray(); } catch { /* table may not exist */ }

        // ── Build chart data: last 6 months revenue + debt ───────────
        const now = new Date();
        const months = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.push({ year: d.getFullYear(), month: d.getMonth(), label: MONTH_LABELS[d.getMonth()] });
        }

        const chart = months.map(({ year, month, label }) => {
          const inMonth = allInvoices.filter(inv => {
            if (!inv.createdAt) return false;
            const d = new Date(inv.createdAt);
            return d.getFullYear() === year && d.getMonth() === month;
          });
          // Payments that fall in this month
          const paymentsInMonth = allPayments.filter(p => {
            if (!p.createdAt) return false;
            const d = new Date(p.createdAt);
            return d.getFullYear() === year && d.getMonth() === month;
          });
          const paymentRevenue = paymentsInMonth.reduce((s, p) => s + (p.amount || 0), 0);
          const revenue = inMonth
            .filter(inv => inv.invoiceType === "selling")
            .reduce((s, inv) => s + (inv.total || 0), 0) + paymentRevenue;
          const debt = inMonth
            .filter(inv => inv.invoiceType === "buying" && inv.status !== "paid")
            .reduce((s, inv) => s + (inv.balanceDue ?? Math.max(0, (inv.total || 0) - (inv.amountPaid || 0))), 0);
          return { month: label, revenue, debt };
        });
        setChartData(chart);

        // ── Recent invoices: last 5, newest first ────────────────────
        const sorted = [...allInvoices]
          .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
          .slice(0, 5)
          .map((inv, i) => ({
            id: `#INV-${String(allInvoices.length - i).padStart(3, "0")}`,
            customer: custMap[inv.customerId] || "Unknown",
            date: inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : "—",
            amount: inv.total || 0,
            status: inv.status === "paid" ? "Paid" : inv.status === "partial" ? "Partial" : "Pending",
          }));
        setRecentInvoices(sorted);
      } catch (err) {
        console.error("RevenueChart load error:", err);
      }
    })();
  }, [location.key]);
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
      {/* ── Header ────────────────────────────────── */}
      <h3 className="text-lg font-semibold text-[#229799] mb-4">Revenue Growth</h3>

      {/* ── Chart ─────────────────────────────────── */}
      <div className="w-full h-52">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#229799" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#229799" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="debtGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
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
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, paddingBottom: 8 }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="#229799"
              strokeWidth={2.5}
              fill="url(#revenueGrad)"
              dot={false}
              activeDot={{ r: 5, fill: "#229799", stroke: "#fff", strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="debt"
              name="Seller's Debt"
              stroke="#ef4444"
              strokeWidth={2.5}
              fill="url(#debtGrad)"
              dot={false}
              activeDot={{ r: 5, fill: "#ef4444", stroke: "#fff", strokeWidth: 2 }}
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
            {recentInvoices.map((inv) => (
              <tr key={inv.id} className="border-b border-gray-50 last:border-0">
                <td className="px-2 py-2 font-medium text-gray-700">{inv.id}</td>
                <td className="px-2 py-2">{inv.customer}</td>
                <td className="px-2 py-2 text-gray-400">{inv.date}</td>
                <td className="px-2 py-2 text-right font-medium">₹{inv.amount.toLocaleString("en-IN")}</td>
                <td className="px-2 py-2 text-center">
                  <span
                    className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      inv.status === "Paid"
                        ? "bg-emerald-100 text-emerald-600"
                        : inv.status === "Partial"
                        ? "bg-amber-100 text-amber-600"
                        : "bg-red-100 text-red-500"
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
