import { useEffect, useState, useMemo } from "react";
import db from "../db";
import { enqueue } from "../services/syncManager";
import StatsCard from "../components/StatsCard";
import CustomerCard from "../components/CustomerCard";

// ─── Dummy seed data (used when IndexedDB is empty) ──────────────────────────
const SEED_CUSTOMERS = [
  { name: "Elon Mask",   phone: "(207) 444-2901", email: "elon@gmail.com",   address: "United States", status: "Active",   amountOwed: 24500 },
  { name: "Tony Stark",  phone: "(207) 234-3214", email: "tony@gmail.com",   address: "Australia",     status: "Inactive", amountOwed: 0 },
  { name: "Henry Cavil", phone: "44-0343-234",    email: "henry@gmail.com",  address: "England",       status: "Active",   amountOwed: 8750 },
  { name: "Mike Banner", phone: "(223) 323-7743", email: "mike@gmail.com",   address: "Canada",        status: "Active",   amountOwed: 3200 },
  { name: "Tom Camel",   phone: "11-2093-2342",   email: "tom@gmail.com",    address: "French",        status: "Inactive", amountOwed: 1500 },
  { name: "Raj Patel",   phone: "(234) 11-23333", email: "raj@gmail.com",    address: "India",         status: "Active",   amountOwed: 15000 },
  { name: "James Brown", phone: "11-3664-2424",   email: "brown@gmail.com",  address: "Brazil",        status: "Active",   amountOwed: 6800 },
  { name: "Wei Chen",    phone: "(001) 221-2901", email: "wei@gmail.com",    address: "Japan",         status: "Active",   amountOwed: 42000 },
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
  const [form, setForm] = useState({
    name: "", phone: "", email: "", address: "", amountOwed: "",
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
    setCustomers(all);
  };

  useEffect(() => { loadCustomers(); }, []);

  // ── Derived stats ──────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = customers.length;
    const active = customers.filter((c) => c.status === "Active").length;
    const inactive = total - active;
    const pendingAmount = customers.reduce(
      (sum, c) => sum + (c.amountOwed ?? 0), 0
    );
    return { total, active, inactive, pendingAmount };
  }, [customers]);

  // ── Filtered list ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = customers;
    if (statusFilter !== "All") {
      list = list.filter((c) => c.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.email ?? "").toLowerCase().includes(q) ||
          (c.phone ?? "").includes(q)
      );
    }
    return list;
  }, [customers, search, statusFilter]);

  // ── Create customer (offline-first) ────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const newCustomer = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      status: "Active",
      amountOwed: Number(form.amountOwed) || 0,
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

    setForm({ name: "", phone: "", email: "", address: "", amountOwed: "" });
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

  // ────────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ═══ Header ═══════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
        <div className="flex items-center gap-3">
          <button className="border border-gray-300 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors">
            📥 Import Customers
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-[#229799] hover:bg-[#1b7f81] text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            + New Customer
          </button>
        </div>
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
        <div className="flex items-center gap-2">
          <button className="border border-gray-300 text-gray-600 rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
            Export
          </button>
          <button className="border border-gray-300 text-gray-600 rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            Bulk Actions
          </button>
          {/* Status filter pills */}
          <div className="hidden sm:flex items-center gap-1 ml-2">
            {["All", "Active", "Inactive"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? "bg-[#229799] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

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
              className="w-full sm:w-56 pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm
                         placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#229799]/40 focus:border-[#229799]"
            />
          </div>
          <button className="border border-gray-300 text-gray-600 rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
            </svg>
            Filter
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
              type="email" placeholder="Email"
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
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
            {search || statusFilter !== "All"
              ? "No customers match your filters."
              : "No customers yet — click \"+ New Customer\" to add one."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              onEdit={() => {/* TODO: open edit modal */}}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}
