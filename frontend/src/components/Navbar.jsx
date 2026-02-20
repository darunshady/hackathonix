import { NavLink } from "react-router-dom";
import useOnlineStatus from "../hooks/useOnlineStatus";
import { syncNow } from "../services/syncManager";
import { useState } from "react";

/**
 * Top navigation bar with sync status indicator.
 * Uses #229799 cyan as the primary brand colour.
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
        ? "bg-white/20 text-white"
        : "text-white/70 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <nav className="bg-[#229799] sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
        {/* ── Brand ─────────────────────────── */}
        <NavLink to="/" className="text-xl font-bold text-white tracking-tight">
          Nano<span className="text-white/80">Biz</span>
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
                ? "bg-white/20 text-white"
                : "bg-red-500/30 text-red-100"
            }`}
          >
            {online ? "● Online" : "● Offline"}
          </span>

          {/* Manual sync button */}
          <button
            onClick={handleSync}
            disabled={syncing || !online}
            className="text-xs bg-white text-[#229799] font-semibold hover:bg-white/90 disabled:opacity-40
                       px-3 py-1.5 rounded-lg transition-colors"
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
