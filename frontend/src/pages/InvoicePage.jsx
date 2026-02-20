import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import db from "../db";
import StatCard from "../components/StatCard";
import InvoiceTable from "../components/InvoiceTable";
import RecordPaymentModal from "../components/RecordPaymentModal";

/* ── Inline SVG icons for KPI cards ────────────────────── */
const SalesIcon = () => (
  <svg className="w-6 h-6 text-[#229799]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const CustomersIcon = () => (
  <svg className="w-6 h-6 text-[#229799]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
  </svg>
);

const InvoicesIcon = () => (
  <svg className="w-6 h-6 text-[#229799]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
);

const PendingIcon = () => (
  <svg className="w-6 h-6 text-[#229799]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

/* ── Floating "+" icon ─────────────────────────────────── */
const PlusIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   InvoicePage — main Invoices screen (reads from IndexedDB)
   ═══════════════════════════════════════════════════════════ */
export default function InvoicePage() {
  const [invoices, setInvoices] = useState([]);

  /* ── Load invoices from IndexedDB ───────────── */
  const loadInvoices = useCallback(async () => {
    const allInvoices = await db.invoices.toArray();
    const allCustomers = await db.customers.toArray();
    const customerMap = Object.fromEntries(allCustomers.map((c) => [c.id, c]));

    // Map to the shape InvoiceTable expects
    const mapped = allInvoices.map((inv) => {
      const cust = customerMap[inv.customerId];
      return {
        id: inv.id,
        customerName: cust?.name || "Unknown",
        phone: cust?.phone || "",
        date: inv.createdAt ? inv.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
        amount: inv.total || 0,
        amountPaid: inv.amountPaid || 0,
        paymentStatus: inv.status || "pending",
        syncStatus: inv.synced ? "synced" : "pending",
      };
    });

    // Sort newest first
    mapped.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    setInvoices(mapped);
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  /* ── Actions ────────────────────────────────── */
  const handleMarkPaid = async (id) => {
    // Update IndexedDB
    const inv = await db.invoices.get(id);
    if (inv) {
      const remainingBalance = (inv.total || 0) - (inv.amountPaid || 0);

      await db.invoices.update(id, {
        status: "paid",
        amountPaid: inv.total || 0,
        balanceDue: 0,
        synced: 0,
      });

      // Create ledger entry for the remaining amount being paid
      if (remainingBalance > 0) {
        const now = new Date().toISOString();
        await db.ledger.add({
          clientId: `ledger-markpaid-${id}-${Date.now()}`,
          customerId: inv.customerId || "",
          invoiceId: id,
          type: "debit",
          amount: remainingBalance,
          source: "payment",
          synced: 0,
          createdAt: now,
        });

        // Update cached customer balance
        if (inv.customerId) {
          const cust = await db.customers.get(inv.customerId);
          if (cust) {
            const newOwed = Math.max(0, (cust.amountOwed || 0) - remainingBalance);
            await db.customers.update(inv.customerId, { amountOwed: newOwed, synced: 0 });
          }
        }
      }
    }
    loadInvoices();
  };

  const handleResendWA = async (id) => {
    const inv = invoices.find((i) => i.id === id);
    if (!inv) return;

    // Guard: must be synced first
    if (inv.syncStatus !== "synced") {
      alert("Please sync this invoice before sending via WhatsApp.");
      return;
    }

    window.open(
      `https://wa.me/91${inv.phone}?text=${encodeURIComponent(
        `Hi ${inv.customerName}, your invoice ${inv.id} for ₹${inv.amount} is ${inv.paymentStatus}. Thank you!`
      )}`,
      "_blank"
    );

    // Mark whatsappSent flag
    await db.invoices.update(id, { whatsappSent: true });
    loadInvoices();
  };

  /* ── Payment state ──────────────────────────── */
  const [payments, setPayments] = useState([]);
  const [paymentInvoice, setPaymentInvoice] = useState(null);
  const [paymentCounter, setPaymentCounter] = useState(1);

  const handleRecordPayment = (invoice) => {
    setPaymentInvoice(invoice);
  };

  const handleSavePayment = async (paymentData) => {
    const newPayment = {
      id: `PAY-${String(paymentCounter).padStart(3, "0")}`,
      ...paymentData,
    };
    setPayments((prev) => [newPayment, ...prev]);
    setPaymentCounter((c) => c + 1);

    // Update the invoice in IndexedDB
    const inv = await db.invoices.get(paymentData.invoiceId);
    if (inv) {
      const newPaid = (inv.amountPaid || 0) + paymentData.amount;
      const newBalance = Math.max(0, (inv.total || 0) - newPaid);
      const newStatus = newBalance <= 0 ? "paid" : "partial";
      await db.invoices.update(paymentData.invoiceId, {
        amountPaid: newPaid,
        balanceDue: newBalance,
        status: newStatus,
        synced: 0,
      });

      // ── Create ledger entry (debit — reduces what customer owes) ──
      const now = new Date().toISOString();
      await db.ledger.add({
        clientId: `ledger-pay-${newPayment.id}`,
        customerId: inv.customerId || "",
        invoiceId: paymentData.invoiceId,
        type: "debit",
        amount: paymentData.amount,
        source: "payment",
        synced: 0,
        createdAt: now,
      });

      // ── Update cached customer balance ────────────────────────────
      if (inv.customerId) {
        const cust = await db.customers.get(inv.customerId);
        if (cust) {
          const newOwed = Math.max(0, (cust.amountOwed || 0) - paymentData.amount);
          await db.customers.update(inv.customerId, { amountOwed: newOwed, synced: 0 });
        }
      }
    }

    // Also save to payments table
    try {
      await db.payments.add({
        id: newPayment.id,
        customerId: inv?.customerId || "",
        customerName: paymentData.customerName || "",
        invoiceId: paymentData.invoiceId,
        amount: paymentData.amount,
        method: paymentData.method || "Cash",
        note: paymentData.note || "",
        date: paymentData.date || new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString(),
        synced: 0,
      });
    } catch (e) {
      console.warn("Could not save payment to DB:", e);
    }

    setPaymentInvoice(null);
    // Reload invoices to reflect updated amounts
    loadInvoices();
  };

  /* ── Search & date filter state ──────────────── */
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const searchRef = useRef(null);

  const resetFilters = () => {
    setSearchTerm("");
    setShowSuggestions(false);
    setFromDate("");
    setToDate("");
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ── Autocomplete suggestions ───────────────── */
  const suggestions = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const q = searchTerm.toLowerCase();
    const qDigits = searchTerm.replace(/\D/g, "");
    const seen = new Set();
    const results = [];

    for (const inv of invoices) {
      if (seen.has(inv.customerName)) continue;
      const nameMatch = inv.customerName.toLowerCase().includes(q);
      const phoneMatch = qDigits && inv.phone.replace(/\D/g, "").includes(qDigits);
      if (nameMatch || phoneMatch) {
        seen.add(inv.customerName);
        results.push({ name: inv.customerName, phone: inv.phone });
      }
    }
    return results;
  }, [invoices, searchTerm]);

  /* ── Combined filtering ─────────────────────── */
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Search — match name or phone
      let matchesSearch = true;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const qDigits = searchTerm.replace(/\D/g, "");
        matchesSearch =
          inv.customerName.toLowerCase().includes(q) ||
          (qDigits ? inv.phone.replace(/\D/g, "").includes(qDigits) : false);
      }

      // Date range
      const matchesFrom = !fromDate || new Date(inv.date) >= new Date(fromDate);
      const matchesTo = !toDate || new Date(inv.date) <= new Date(toDate);

      return matchesSearch && matchesFrom && matchesTo;
    });
  }, [invoices, searchTerm, fromDate, toDate]);

  const hasActiveFilters = searchTerm || fromDate || toDate;

  /* ── Recalc KPIs from state ─────────────────── */
  const kpiSales     = invoices.reduce((s, i) => s + i.amount, 0);
  const kpiPending   = invoices.filter((i) => i.paymentStatus !== "paid").reduce((s, i) => s + i.amount, 0);
  const kpiCustomers = new Set(invoices.map((i) => i.phone)).size;
  const kpiInvoices  = invoices.length;

  return (
    <div className="space-y-6 pb-24">
      {/* ── Header ──────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Invoices</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage and track all your invoices.</p>
        </div>
      </div>

      {/* ── KPI Cards ───────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Sales"
          value={`₹${kpiSales.toLocaleString("en-IN")}`}
          icon={<SalesIcon />}
        />
        <StatCard
          title="Total Customers"
          value={kpiCustomers}
          icon={<CustomersIcon />}
        />
        <StatCard
          title="Total Invoices"
          value={kpiInvoices}
          icon={<InvoicesIcon />}
        />
        <StatCard
          title="Total Pending"
          value={`₹${kpiPending.toLocaleString("en-IN")}`}
          icon={<PendingIcon />}
        />
      </div>

      {/* ── Search & Date Toolbar ───────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          Showing <span className="font-semibold text-gray-700">{filteredInvoices.length}</span> of{" "}
          <span className="font-semibold text-gray-700">{invoices.length}</span> invoices
        </p>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Autocomplete Search */}
          <div className="relative flex-1 sm:flex-none" ref={searchRef}>
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              placeholder="Search customer or phone..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setShowSuggestions(true); }}
              onFocus={() => { if (searchTerm.trim()) setShowSuggestions(true); }}
              className="w-full sm:w-64 pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm
                         placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#229799]/40 focus:border-[#229799]"
            />

            {/* Suggestion Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
                {suggestions.map((s) => (
                  <li
                    key={s.name}
                    onClick={() => { setSearchTerm(s.name); setShowSuggestions(false); }}
                    className="px-4 py-2 text-sm cursor-pointer transition-colors
                               hover:bg-[#229799] hover:text-white"
                  >
                    <span className="font-medium">{s.name}</span>
                    <span className="ml-2 text-xs opacity-60">{s.phone}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* From Date */}
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            title="From date"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600
                       focus:outline-none focus:ring-2 focus:ring-[#229799]/40 focus:border-[#229799]"
          />

          {/* To Date */}
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            title="To date"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600
                       focus:outline-none focus:ring-2 focus:ring-[#229799]/40 focus:border-[#229799]"
          />

          {/* Reset */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="border border-gray-300 text-gray-600 rounded-lg px-3 py-2 text-sm font-medium
                         hover:bg-gray-50 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ── Invoice Table ───────────────────────── */}
      <InvoiceTable
        invoices={filteredInvoices}
        onMarkPaid={handleMarkPaid}
        onResendWA={handleResendWA}
        onRecordPayment={handleRecordPayment}
      />

      {/* ── Record Payment Modal ────────────────── */}
      <RecordPaymentModal
        open={!!paymentInvoice}
        invoice={paymentInvoice}
        onClose={() => setPaymentInvoice(null)}
        onSave={handleSavePayment}
      />

      {/* ── Floating "+ New Invoice" FAB ─────────── */}
      <Link
        to="/invoices/new"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-[#229799] hover:bg-[#1b7f81]
                   text-white pl-4 pr-5 py-3 rounded-full shadow-lg hover:shadow-xl transition-all
                   text-sm font-semibold"
      >
        <PlusIcon />
        New Invoice
      </Link>
    </div>
  );
}
