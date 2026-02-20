import { useCallback, useEffect, useMemo, useState } from "react";
import db from "../db";
import PaymentTable from "../components/PaymentTable";
import PaymentModal from "../components/PaymentModal";
import StatCard from "../components/StatCard";

/* ── Inline SVG icons for KPI cards ────────────────────── */
const CollectedIcon = () => (
  <svg className="w-6 h-6 text-[#229799]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
  </svg>
);

const TodayIcon = () => (
  <svg className="w-6 h-6 text-[#229799]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
  </svg>
);

const PartialIcon = () => (
  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const SettledIcon = () => (
  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   PaymentsPage — Track all received payments
   ═══════════════════════════════════════════════════════════ */
export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  /* ── Load data from IndexedDB ────────────────── */
  const loadPayments = useCallback(async () => {
    const all = await db.payments.toArray();
    setPayments(all.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")));
  }, []);

  const loadInvoices = useCallback(async () => {
    const all = await db.invoices.toArray();
    setInvoices(all);
  }, []);

  useEffect(() => {
    loadPayments();
    loadInvoices();
  }, [loadPayments, loadInvoices]);

  /* ── Handle save from modal ──────────────────── */
  const handlePaymentSaved = () => {
    loadPayments();
    loadInvoices();
  };

  /* ── KPI calculations (live data) ────────────── */
  const kpis = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const todayStr = now.toISOString().slice(0, 10);

    const collectedThisMonth = payments
      .filter((p) => new Date(p.date) >= startOfMonth)
      .reduce((s, p) => s + Number(p.amount), 0);

    const collectedToday = payments
      .filter((p) => p.date === todayStr)
      .reduce((s, p) => s + Number(p.amount), 0);

    // Partial = invoices with status "partial"
    const partialPayments = invoices.filter((inv) => inv.status === "partial").length;

    // Fully settled = invoices where balanceDue is 0 or status is "paid"
    const fullySettled = invoices.filter(
      (inv) => inv.status === "paid" || (inv.balanceDue != null && inv.balanceDue <= 0)
    ).length;

    return { collectedThisMonth, collectedToday, partialPayments, fullySettled };
  }, [payments, invoices]);

  const fmt = (n) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Payments</h1>
          <p className="text-sm text-gray-500">Track all received payments</p>
        </div>

        <button
          onClick={() => setIsPaymentModalOpen(true)}
          className="bg-[#229799] hover:bg-[#1b7f81] text-white px-4 py-2 rounded-lg shadow-sm transition text-sm font-medium"
        >
          Make Payment
        </button>
      </div>

      {/* ── KPI Cards ───────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Collected (This Month)"
          value={fmt(kpis.collectedThisMonth)}
          icon={<CollectedIcon />}
          iconBg="bg-cyan-50"
        />
        <StatCard
          title="Collected (Today)"
          value={fmt(kpis.collectedToday)}
          icon={<TodayIcon />}
          iconBg="bg-cyan-50"
        />
        <StatCard
          title="Partial Payments"
          value={kpis.partialPayments}
          icon={<PartialIcon />}
          iconBg="bg-amber-50"
        />
        <StatCard
          title="Fully Settled"
          value={kpis.fullySettled}
          icon={<SettledIcon />}
          iconBg="bg-green-50"
        />
      </div>

      {/* ── Payments Table ──────────────────────── */}
      <PaymentTable payments={payments} />

      {/* ── Payment Modal ───────────────────────── */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSave={handlePaymentSaved}
      />
    </div>
  );
}
