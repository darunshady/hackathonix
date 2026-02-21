import { useEffect, useState, useMemo } from "react";
import db from "../db";
import { enqueue } from "../services/syncManager";
import StatsCard from "../components/StatsCard";
import CustomerCard from "../components/CustomerCard";
import CustomerDrawer from "../components/CustomerDrawer";

// ─── Dummy seed data (used when IndexedDB is empty) ──────────────────────────
const SEED_CUSTOMERS = [
  { name: "Elon Mask",   phone: "(207) 444-2901", address: "United States", status: "Active",   amountOwed: 24500, sellerDebt: 5000, lastInvoiceDate: "2026-02-15", hasPendingInvoice: true },
  { name: "Tony Stark",  phone: "(207) 234-3214", address: "Australia",     status: "Inactive", amountOwed: 0,     sellerDebt: 0,    lastInvoiceDate: "2025-11-20", hasPendingInvoice: false },
  { name: "Henry Cavil", phone: "44-0343-234",    address: "England",       status: "Active",   amountOwed: 8750,  sellerDebt: 2000, lastInvoiceDate: "2026-02-01", hasPendingInvoice: true },
  { name: "Mike Banner", phone: "(223) 323-7743", address: "Canada",        status: "Active",   amountOwed: 3200,  sellerDebt: 4500, lastInvoiceDate: "2026-01-28", hasPendingInvoice: false },
  { name: "Tom Camel",   phone: "11-2093-2342",   address: "French",        status: "Inactive", amountOwed: 1500,  sellerDebt: 0,    lastInvoiceDate: "2025-09-10", hasPendingInvoice: false },
  { name: "Raj Patel",   phone: "(234) 11-23333", address: "India",         status: "Active",   amountOwed: 15000, sellerDebt: 3000, lastInvoiceDate: "2026-02-18", hasPendingInvoice: true },
  { name: "James Brown", phone: "11-3664-2424",   address: "Brazil",        status: "Active",   amountOwed: 6800,  sellerDebt: 8000, lastInvoiceDate: "2026-01-05", hasPendingInvoice: true },
  { name: "Wei Chen",    phone: "(001) 221-2901", address: "Japan",         status: "Active",   amountOwed: 42000, sellerDebt: 10000, lastInvoiceDate: "2026-02-10", hasPendingInvoice: true },
];

/**
 * CustomersPage — Modern SaaS-style customer management dashboard.
 *
 * Features:
 *  - Stats overview cards
 *  - Search / filter toolbar
 *  - Responsive customer card grid
 *  - New-customer modal form (inline)
 *  - Offline-first persistence via IndexedDB + SyncManager
 */
export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerCustomer, setDrawerCustomer] = useState(null);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [filterAmountRange, setFilterAmountRange] = useState("All");
  const [filterDateRange, setFilterDateRange] = useState("All");
  const [filterPending, setFilterPending] = useState("All");
  const [form, setForm] = useState({
    name: "", phone: "", address: "", amountOwed: "", sellerDebt: "",
  });

  // ── Load from IndexedDB (seed on first visit) ─────────────────────
  const loadCustomers = async () => {
    let all = await db.customers.orderBy("name").toArray();

    // Seed dummy data if DB is empty (hackathon demo)
    if (all.length === 0) {
      const seeded = SEED_CUSTOMERS.map((c) => ({
        id: crypto.randomUUID(),
        ...c,
        synced: 0,
        createdAt: new Date().toISOString(),
      }));
      await db.customers.bulkAdd(seeded);
      all = seeded;
    }

    // Backfill sellerDebt / lastInvoiceDate / hasPendingInvoice for existing records
    const SEED_MAP = Object.fromEntries(
      SEED_CUSTOMERS.map((c) => [c.name, c])
    );
    for (const c of all) {
      const patch = {};
      if (c.sellerDebt === undefined || c.sellerDebt === null) {
        patch.sellerDebt = SEED_MAP[c.name]?.sellerDebt ?? 0;
      }
      if (c.lastInvoiceDate === undefined) {
        patch.lastInvoiceDate = SEED_MAP[c.name]?.lastInvoiceDate ?? null;
      }
      if (c.hasPendingInvoice === undefined) {
        patch.hasPendingInvoice = SEED_MAP[c.name]?.hasPendingInvoice ?? false;
      }
      if (Object.keys(patch).length > 0) {
        await db.customers.update(c.id, patch);
        Object.assign(c, patch);
      }
    }

    setCustomers(all);
  };

  useEffect(() => { loadCustomers(); }, []);

  // ── Derived stats ──────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = customers.length;
    const active = customers.filter((c) => c.status === "Active").length;
    const inactive = total - active;
    const pendingAmount = customers.reduce(
      (sum, c) => sum + ((c.amountOwed ?? 0) - (c.sellerDebt ?? 0)), 0
    );
    return { total, active, inactive, pendingAmount };
  }, [customers]);

  // ── Filtered list ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const last30 = new Date(now.getTime() - 30 * 86400000);

    return customers.filter((c) => {
      // Status (from tab pills)
      if (statusFilter !== "All" && c.status !== statusFilter) return false;

      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!c.name.toLowerCase().includes(q) && !(c.phone ?? "").includes(q)) return false;
      }

      // Amount owed
      const owed = c.amountOwed ?? 0;
      if (filterAmountRange === "zero" && owed !== 0) return false;
      if (filterAmountRange === "low" && (owed <= 0 || owed > 5000)) return false;
      if (filterAmountRange === "high" && owed < 5000) return false;

      // Invoice date
      if (filterDateRange !== "All" && c.lastInvoiceDate) {
        const d = new Date(c.lastInvoiceDate);
        if (filterDateRange === "month" && d < startOfMonth) return false;
        if (filterDateRange === "30days" && d < last30) return false;
        if (filterDateRange === "older" && d >= last30) return false;
      } else if (filterDateRange !== "All" && !c.lastInvoiceDate) {
        // No date recorded — only show in "older" or "All"
        if (filterDateRange !== "older") return false;
      }

      // Pending invoice
      if (filterPending === "yes" && !c.hasPendingInvoice) return false;
      if (filterPending === "no" && c.hasPendingInvoice) return false;

      return true;
    });
  }, [customers, search, statusFilter, filterAmountRange, filterDateRange, filterPending]);

  // Count active advanced filters (exclude status tabs & search)
  const activeFilterCount = [filterAmountRange, filterDateRange, filterPending].filter((v) => v !== "All").length;

  const resetFilters = () => {
    setFilterAmountRange("All");
    setFilterDateRange("All");
    setFilterPending("All");
  };

  // ── Create customer (offline-first) ────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert("Customer name is required.");
    if (!form.phone.trim()) return alert("Phone number is required.");

    // Check for duplicate phone
    const existing = await db.customers.toArray();
    if (existing.some((c) => c.phone.replace(/\D/g, "") === form.phone.replace(/\D/g, ""))) {
      return alert("A customer with this phone number already exists.");
    }

    const newCustomer = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      status: "Active",
      amountOwed: Number(form.amountOwed) || 0,
      sellerDebt: Number(form.sellerDebt) || 0,
      synced: navigator.onLine ? 1 : 0,
      createdAt: new Date().toISOString(),
    };

    await db.customers.add(newCustomer);

    if (!navigator.onLine) {
      await enqueue("customer", newCustomer.id, "create");
    } else {
      try {
        const { default: api } = await import("../services/api");
        await api.post("/customers", {
          clientId: newCustomer.id,
          name: newCustomer.name,
          phone: newCustomer.phone,
          address: newCustomer.address,
        });
        await db.customers.update(newCustomer.id, { synced: 1 });
      } catch {
        await enqueue("customer", newCustomer.id, "create");
        await db.customers.update(newCustomer.id, { synced: 0 });
      }
    }

    setForm({ name: "", phone: "", address: "", amountOwed: "", sellerDebt: "" });
    setShowForm(false);
    loadCustomers();
  };

  // ── Card action callbacks ──────────────────────────────────────────
  const handleToggleStatus = async (customer) => {
    const newStatus = customer.status === "Active" ? "Inactive" : "Active";
    await db.customers.update(customer.id, { status: newStatus, synced: 0 });
    loadCustomers();
  };

  const handleDelete = async (customer) => {
    if (!confirm(`Delete "${customer.name}"?`)) return;
    await db.customers.delete(customer.id);
    loadCustomers();
  };

  // ── Drawer callbacks ───────────────────────────────────────────────
  const openDrawer = (customer) => {
    setDrawerCustomer(customer);
    setDrawerOpen(true);
  };

  const handleDrawerSave = async (updated) => {
    await db.customers.update(updated.id, {
      name: updated.name,
      phone: updated.phone,
      status: updated.status,
      amountOwed: updated.amountOwed,
      sellerDebt: updated.sellerDebt,
      notes: updated.notes,
      synced: 0,
    });
    setDrawerOpen(false);
    setDrawerCustomer(null);
    loadCustomers();
  };

  // ────────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ═══ Header ═══════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#229799] hover:bg-[#1b7f81] text-white rounded-xl px-5 py-2 text-sm font-medium shadow-sm transition-colors flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Customer
        </button>
      </div>

      {/* ═══ Stats Cards ══════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Total Customers"
          value={stats.total}
          icon={
            <svg className="w-6 h-6 text-[#229799]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
          }
          iconBg="bg-cyan-50"
        />
        <StatsCard
          label="Active Customers"
          value={stats.active}
          icon={
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          }
          iconBg="bg-green-50"
        />
        <StatsCard
          label="Inactive Customers"
          value={stats.inactive < 10 ? `0${stats.inactive}` : stats.inactive}
          icon={
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM4 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 10.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
            </svg>
          }
          iconBg="bg-red-50"
        />
        <StatsCard
          label="Total Pending Amount"
          value={`₹${stats.pendingAmount.toLocaleString("en-IN")}`}
          icon={
            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          }
          iconBg="bg-amber-50"
        />
      </div>

      {/* ═══ Toolbar ══════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Status filter tabs */}
        <div className="flex items-center gap-2">
          {["All", "Active", "Inactive"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                statusFilter === s
                  ? "bg-[#229799] text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              placeholder="Search Customer"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-56 pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm
                         placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#229799]/40 focus:border-[#229799] shadow-sm"
            />
          </div>
          <button
            onClick={() => setFilterDrawerOpen(true)}
            className={`border rounded-xl px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 shadow-sm relative ${
              activeFilterCount > 0
                ? "border-[#229799] text-[#229799] bg-cyan-50"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
            </svg>
            Filter
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#229799] text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ═══ New Customer Form (collapsible) ══════════════════════════ */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4"
        >
          <h2 className="text-lg font-semibold text-gray-800">Add New Customer</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <input
              type="text" placeholder="Full Name *" required
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-[#229799]/40 focus:border-[#229799]"
            />
            <input
              type="text" placeholder="Phone"
              value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-[#229799]/40 focus:border-[#229799]"
            />
            <input
              type="text" placeholder="Location / Address"
              value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-[#229799]/40 focus:border-[#229799]"
            />
            <input
              type="number" placeholder="Amount Owed (₹)" min="0"
              value={form.amountOwed} onChange={(e) => setForm({ ...form, amountOwed: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-[#229799]/40 focus:border-[#229799]"
            />
            <input
              type="number" placeholder="Seller Debt (₹)" min="0"
              value={form.sellerDebt} onChange={(e) => setForm({ ...form, sellerDebt: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-[#229799]/40 focus:border-[#229799]"
            />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="bg-[#229799] hover:bg-[#1b7f81] text-white rounded-lg px-5 py-2 text-sm font-medium transition-colors"
            >
              Save Customer
            </button>
            <button
              type="button" onClick={() => setShowForm(false)}
              className="border border-gray-300 text-gray-600 rounded-lg px-5 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ═══ Customer Grid ════════════════════════════════════════════ */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <p className="text-gray-400 text-sm">
            {search || statusFilter !== "All" || activeFilterCount > 0
              ? "No customers match selected filters."
              : "No customers yet — click \"+ New Customer\" to add one."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              onEdit={openDrawer}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      )}

      {/* ═══ Filter Drawer (right-side panel) ════════════════════════ */}
      {filterDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/30 transition-opacity"
            onClick={() => setFilterDrawerOpen(false)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-sm bg-white shadow-xl animate-slide-in-right flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
              <button
                onClick={() => setFilterDrawerOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Filter Sections */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

              {/* ─ Amount Owed ─ */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Amount Owed</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "All", label: "All" },
                    { key: "zero", label: "No Dues (₹0)" },
                    { key: "low", label: "₹1 – ₹5,000" },
                    { key: "high", label: "₹5,000+" },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setFilterAmountRange(key)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        filterAmountRange === key
                          ? "bg-[#229799] text-white shadow-sm"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ─ Invoice Date ─ */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Last Invoice Date</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "All", label: "All" },
                    { key: "month", label: "This Month" },
                    { key: "30days", label: "Last 30 Days" },
                    { key: "older", label: "Older" },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setFilterDateRange(key)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        filterDateRange === key
                          ? "bg-[#229799] text-white shadow-sm"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ─ Pending Invoice ─ */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Pending Invoice</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "All", label: "All" },
                    { key: "yes", label: "Yes" },
                    { key: "no", label: "No" },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setFilterPending(key)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        filterPending === key
                          ? "bg-[#229799] text-white shadow-sm"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-6 py-4 flex items-center gap-3">
              <button
                onClick={() => { resetFilters(); setFilterDrawerOpen(false); }}
                className="flex-1 border border-gray-300 text-gray-600 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Reset Filters
              </button>
              <button
                onClick={() => setFilterDrawerOpen(false)}
                className="flex-1 bg-[#229799] hover:bg-[#1b7f81] text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Customer Profile Drawer ═════════════════════════════════ */}
      <CustomerDrawer
        open={drawerOpen}
        customer={drawerCustomer}
        onClose={() => { setDrawerOpen(false); setDrawerCustomer(null); }}
        onSave={handleDrawerSave}
      />
    </div>
  );
}
