import { useState } from "react";

/**
 * CustomerCard — Individual customer card for the grid.
 *
 * Shows name, location/address, phone, email, status badge,
 * and amount owed in ₹. No avatar/profile image used.
 *
 * @param {object}   customer          – Customer data object
 * @param {function} onEdit            – Callback for edit action
 * @param {function} onDelete          – Callback for delete action
 * @param {function} onToggleStatus    – Callback to toggle active/inactive
 */
export default function CustomerCard({
  customer,
  onEdit,
  onDelete,
  onToggleStatus,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = customer.status === "Active";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 p-5 relative">
      {/* ── Top Row: Name + 3-dot menu ──────────────── */}
      <div className="flex items-start justify-between mb-4">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-gray-800 truncate">
            {customer.name}
          </h3>
          {customer.address && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">
              {customer.address}
            </p>
          )}
        </div>

        {/* 3-dot menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="More options"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          {menuOpen && (
            <>
              {/* Click-away overlay */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-100 z-20 py-1">
                <button
                  onClick={() => { onEdit?.(customer); setMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => { onToggleStatus?.(customer); setMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  {isActive ? "Mark Inactive" : "Mark Active"}
                </button>
                <button
                  onClick={() => { onDelete?.(customer); setMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Details grid ───────────────────────────── */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm mb-4">
        {/* Mobile */}
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Mobile</p>
          <p className="text-gray-700 font-medium">{customer.phone || "—"}</p>
        </div>

        {/* Email */}
        <div className="min-w-0">
          <p className="text-xs text-gray-400 mb-0.5">Email</p>
          <p className="text-gray-700 font-medium truncate">
            {customer.email || "—"}
          </p>
        </div>

        {/* Status */}
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Status</p>
          <span
            className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${
              isActive
                ? "bg-green-100 text-green-600"
                : "bg-red-100 text-red-600"
            }`}
          >
            {customer.status}
          </span>
        </div>

        {/* Amount Owed */}
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Amount Owed</p>
          <p className="text-amber-600 font-bold text-base">
            ₹{(customer.amountOwed ?? 0).toLocaleString("en-IN")}
          </p>
        </div>
      </div>
    </div>
  );
}
