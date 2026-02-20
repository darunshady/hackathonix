import { useState } from "react";
import { Link } from "react-router-dom";

/* ── Tabs ──────────────────────────────────────────────── */
const TABS = ["All", "Paid", "Pending", "Overdue"];

/* ── Status / Sync badge styles ────────────────────────── */
const STATUS_BADGE = {
  paid: "bg-green-100 text-green-600",
  pending: "bg-amber-100 text-amber-600",
  overdue: "bg-red-100 text-red-600",
};

const SYNC_BADGE = {
  synced: "bg-cyan-100 text-[#229799]",
  pending: "bg-yellow-100 text-yellow-700",
};

/* ── Inline SVG icons ──────────────────────────────────── */
const WhatsAppIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
  </svg>
);

/**
 * InvoiceTable — tabbed, responsive table with status badges and actions.
 *
 * Props:
 *   invoices  — array of invoice objects
 *   onMarkPaid   — (id) => void
 *   onResendWA   — (id) => void
 */
export default function InvoiceTable({ invoices = [], onMarkPaid, onResendWA }) {
  const [activeTab, setActiveTab] = useState("All");

  /* ── Filter by tab ───────────────────────────── */
  const filtered =
    activeTab === "All"
      ? invoices
      : invoices.filter((inv) => inv.paymentStatus.toLowerCase() === activeTab.toLowerCase());

  return (
    <div className="bg-white rounded-2xl shadow-sm">
      {/* ── Tab bar ─────────────────────────────── */}
      <div className="flex items-center gap-2 px-6 pt-5 pb-3">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-sm font-medium px-4 py-1.5 rounded-full transition-colors ${
              activeTab === tab
                ? "bg-[#229799] text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Table ───────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100">
              <th className="px-6 py-3 font-medium">Invoice ID</th>
              <th className="px-6 py-3 font-medium">Customer Name</th>
              <th className="px-6 py-3 font-medium">Phone</th>
              <th className="px-6 py-3 font-medium">Date</th>
              <th className="px-6 py-3 font-medium text-right">Amount (₹)</th>
              <th className="px-6 py-3 font-medium">Payment</th>
              <th className="px-6 py-3 font-medium">Sync</th>
              <th className="px-6 py-3 font-medium text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-10 text-center text-gray-400">
                  No invoices found.
                </td>
              </tr>
            ) : (
              filtered.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-gray-800">{inv.id}</td>
                  <td className="px-6 py-4 text-gray-700">{inv.customerName}</td>
                  <td className="px-6 py-4 text-gray-500">{inv.phone}</td>
                  <td className="px-6 py-4 text-gray-500">{inv.date}</td>
                  <td className="px-6 py-4 text-gray-800 font-semibold text-right">
                    ₹{Number(inv.amount).toLocaleString("en-IN")}
                  </td>

                  {/* Payment badge */}
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${
                        STATUS_BADGE[inv.paymentStatus] || STATUS_BADGE.pending
                      }`}
                    >
                      {inv.paymentStatus.charAt(0).toUpperCase() + inv.paymentStatus.slice(1)}
                    </span>
                  </td>

                  {/* Sync badge */}
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${
                        inv.syncStatus === "synced" ? SYNC_BADGE.synced : SYNC_BADGE.pending
                      }`}
                    >
                      {inv.syncStatus === "synced" ? "Synced" : "Pending Sync"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {/* WhatsApp resend */}
                      <button
                        onClick={() => onResendWA?.(inv.id)}
                        title="Resend via WhatsApp"
                        className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                      >
                        <WhatsAppIcon />
                      </button>

                      {/* View */}
                      <Link
                        to={`/invoices/${inv.id}`}
                        title="View Invoice"
                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                      >
                        <EyeIcon />
                      </Link>

                      {/* Mark as Paid */}
                      {inv.paymentStatus !== "paid" && (
                        <button
                          onClick={() => onMarkPaid?.(inv.id)}
                          title="Mark as Paid"
                          className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg
                                     bg-[#229799] text-white hover:bg-[#1b7f81] transition-colors"
                        >
                          <CheckIcon />
                          Paid
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
