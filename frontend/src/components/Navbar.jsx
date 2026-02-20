import { NavLink } from "react-router-dom";
import useOnlineStatus from "../hooks/useOnlineStatus";
import { syncNow } from "../services/syncManager";
import { useState } from "react";

/**
 * Sidebar / top-bar navigation with sync status indicator.
 */
export default function Navbar() {
  const online = useOnlineStatus();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncNow();
      if (result.ok) {
        alert(
          `Synced ${result.synced.customers} customers & ${result.synced.invoices} invoices`
        );
      } else {
        alert("Sync failed — will retry when online.");
      }
    } finally {
      setSyncing(false);
    }
  };

  const linkClass = ({ isActive }) =>
    `block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? "bg-indigo-600 text-white"
        : "text-slate-300 hover:bg-slate-700 hover:text-white"
    }`;

  return (
    <nav className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
        {/* ── Brand ─────────────────────────── */}
        <NavLink to="/" className="text-xl font-bold text-white tracking-tight">
          Nano<span className="text-indigo-400">Biz</span>
        </NavLink>

        {/* ── Links ─────────────────────────── */}
        <div className="hidden sm:flex items-center gap-1">
          <NavLink to="/" className={linkClass} end>
            Dashboard
          </NavLink>
          <NavLink to="/customers" className={linkClass}>
            Customers
          </NavLink>
          <NavLink to="/invoices" className={linkClass}>
            Invoices
          </NavLink>
          <NavLink to="/invoices/new" className={linkClass}>
            New Invoice
          </NavLink>
        </div>

        {/* ── Status + Sync ─────────────────── */}
        <div className="flex items-center gap-3">
          {/* Online / Offline pill */}
          <span
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
              online
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-red-500/20 text-red-400"
            }`}
          >
            {online ? "● Online" : "● Offline"}
          </span>

          {/* Manual sync button */}
          <button
            onClick={handleSync}
            disabled={syncing || !online}
            className="text-xs bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40
                       text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            {syncing ? "Syncing…" : "Sync"}
          </button>
        </div>
      </div>

      {/* ── Mobile nav (simple) ─────────────── */}
      <div className="sm:hidden flex gap-1 px-4 pb-2 overflow-x-auto">
        <NavLink to="/" className={linkClass} end>Dashboard</NavLink>
        <NavLink to="/customers" className={linkClass}>Customers</NavLink>
        <NavLink to="/invoices" className={linkClass}>Invoices</NavLink>
        <NavLink to="/invoices/new" className={linkClass}>New Invoice</NavLink>
      </div>
    </nav>
  );
}
