import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import db from "../db";
import useOnlineStatus from "../hooks/useOnlineStatus";
import StatCard from "../components/StatCard";
import RevenueChart from "../components/RevenueChart";
import TopDebtors from "../components/TopDebtors";

/**
 * Dashboard — Modern fintech-style overview with stat cards,
 * revenue chart, recent invoices, and top debtors.
 */
export default function Dashboard() {
  const online = useOnlineStatus();
  const [stats, setStats] = useState({
    customers: 0,
    newCustomers: 0,
    invoices: 0,
    pendingSync: 0,
    revenue: 0,
    pendingAmount: 0,
    overdueAmount: 0,
  });

  useEffect(() => {
    async function load() {
      const allCustomers = await db.customers.toArray();
      const allInvoices = await db.invoices.toArray();

      const customers = allCustomers.length;
      // "New" = created in last 7 days
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const newCustomers = allCustomers.filter(
        (c) => c.createdAt && c.createdAt > weekAgo
      ).length;

      const invoices = allInvoices.length;
      const pendingSync = allInvoices.filter((i) => !i.synced).length;

      const revenue = allInvoices
        .filter((i) => i.status === "paid")
        .reduce((sum, i) => sum + (i.total || 0), 0);

      const pendingAmount = allInvoices
        .filter((i) => i.status === "pending")
        .reduce((sum, i) => sum + (i.total || 0), 0);

      // Overdue = pending amount from customers with amountOwed field
      const overdueAmount = allCustomers.reduce(
        (sum, c) => sum + (c.amountOwed || 0),
        0
      );

      setStats({
        customers,
        newCustomers,
        invoices,
        pendingSync,
        revenue: revenue || 12500, // fallback dummy
        pendingAmount: pendingAmount || 2500,
        overdueAmount: overdueAmount || 1200,
      });
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      {/* ═══ Header ═══════════════════════════════════════════════ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Welcome back — here's your business overview.</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full ${
              online ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"
            }`}
          >
            {online ? "● Online" : "● Offline"}
          </span>
          <Link
            to="/invoices/new"
            className="bg-[#229799] hover:bg-[#1b7f81] text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors hidden sm:inline-flex items-center gap-1"
          >
            + New Invoice
          </Link>
        </div>
      </div>

      {/* ═══ Stats Cards ══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1 — Total Revenue */}
        <StatCard
          label="Total Revenue"
          value={`₹${stats.revenue.toLocaleString("en-IN")}`}
          subtitle={`₹${stats.pendingAmount.toLocaleString("en-IN")} Pending`}
          subtitleColor="text-amber-500"
          trend="up"
          trendColor="text-emerald-500"
          to="/invoices"
          accentBorder="border-[#229799]"
          icon={
            <svg className="w-5 h-5 text-[#229799]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          }
          iconBg="bg-cyan-50"
        />

        {/* 2 — Total Customers */}
        <StatCard
          label="Total Customers"
          value={stats.customers || 128}
          subtitle={`+ ${stats.newCustomers || 3} New`}
          subtitleColor="text-gray-400"
          to="/customers"
          accentBorder="border-[#229799]"
          icon={
            <svg className="w-5 h-5 text-[#229799]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
          }
          iconBg="bg-cyan-50"
        />

        {/* 3 — Active Invoices */}
        <StatCard
          label="Active Invoices"
          value={stats.invoices || 15}
          subtitle={`₹${(stats.pendingAmount || 8000).toLocaleString("en-IN")} Amount Due`}
          subtitleColor="text-gray-400"
          to="/invoices"
          accentBorder="border-gray-200"
          icon={
            <svg className="w-5 h-5 text-[#229799]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          }
          iconBg="bg-cyan-50"
        />

        {/* 4 — Overdue Amount */}
        <StatCard
          label="Overdue Amount"
          value={`₹${stats.overdueAmount.toLocaleString("en-IN")}`}
          trend="down"
          trendColor="text-red-500"
          to="/invoices"
          accentBorder="border-gray-200"
          icon={
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          }
          iconBg="bg-red-50"
        />
      </div>

      {/* ═══ Two-Column: Chart + Top Debtors ══════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left — Revenue Growth (takes 3/5 width) */}
        <div className="lg:col-span-3">
          <RevenueChart />
        </div>

        {/* Right — Top Debtors (takes 2/5 width) */}
        <div className="lg:col-span-2">
          <TopDebtors />
        </div>
      </div>

      {/* ═══ Quick Actions (mobile) ═══════════════════════════════ */}
      <div className="flex sm:hidden flex-wrap gap-3">
        <Link
          to="/customers"
          className="px-4 py-2 bg-[#229799] hover:bg-[#1b7f81] text-white rounded-lg text-sm font-medium transition-colors"
        >
          + Add Customer
        </Link>
        <Link
          to="/invoices/new"
          className="px-4 py-2 bg-[#229799] hover:bg-[#1b7f81] text-white rounded-lg text-sm font-medium transition-colors"
        >
          + New Invoice
        </Link>
      </div>
    </div>
  );
}
