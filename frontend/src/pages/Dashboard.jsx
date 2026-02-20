import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import db from "../db";
import useOnlineStatus from "../hooks/useOnlineStatus";

/**
 * Dashboard — quick overview of customers, invoices, and pending syncs.
 */
export default function Dashboard() {
  const online = useOnlineStatus();
  const [stats, setStats] = useState({
    customers: 0,
    invoices: 0,
    pendingSync: 0,
    revenue: 0,
  });

  useEffect(() => {
    async function load() {
      const customers = await db.customers.count();
      const invoices = await db.invoices.count();
      const pendingSync = await db.invoices.where("synced").equals(0).count();
      const allInvoices = await db.invoices.toArray();
      const revenue = allInvoices
        .filter((i) => i.status === "paid")
        .reduce((sum, i) => sum + (i.total || 0), 0);

      setStats({ customers, invoices, pendingSync, revenue });
    }
    load();
  }, []);

  const cards = [
    { label: "Customers", value: stats.customers, color: "bg-indigo-500", to: "/customers" },
    { label: "Invoices", value: stats.invoices, color: "bg-emerald-500", to: "/invoices" },
    { label: "Pending Sync", value: stats.pendingSync, color: "bg-amber-500", to: "/invoices" },
    { label: "Revenue (Paid)", value: `₹${stats.revenue.toLocaleString()}`, color: "bg-cyan-500", to: "/invoices" },
  ];

  return (
    <div>
      {/* ── Header ──────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <span
          className={`text-sm font-medium px-3 py-1 rounded-full ${
            online ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
          }`}
        >
          {online ? "Online" : "Offline — data saved locally"}
        </span>
      </div>

      {/* ── Stat cards ──────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <Link
            key={c.label}
            to={c.to}
            className="rounded-xl p-5 bg-slate-800 border border-slate-700 hover:border-slate-500 transition-colors"
          >
            <p className="text-sm text-slate-400">{c.label}</p>
            <p className="mt-1 text-3xl font-bold">{c.value}</p>
            <div className={`mt-3 h-1 w-12 rounded ${c.color}`} />
          </Link>
        ))}
      </div>

      {/* ── Quick actions ───────────────────── */}
      <div className="flex flex-wrap gap-3">
        <Link
          to="/customers"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
        >
          + Add Customer
        </Link>
        <Link
          to="/invoices/new"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition-colors"
        >
          + Create Invoice
        </Link>
      </div>
    </div>
  );
}
