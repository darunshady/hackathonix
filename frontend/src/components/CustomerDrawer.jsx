import { useState, useEffect } from "react";

/* ── Inline icons ──────────────────────────────────────── */
const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

const RupeeIcon = () => (
  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-sm text-gray-400">₹</span>
);

/**
 * CustomerDrawer — Right-side sliding drawer for viewing / editing
 * a customer profile. Consistent with NanoBiz cyan theme.
 *
 * Props:
 *   open       — boolean
 *   customer   — customer object (pre-fill)
 *   onClose    — () => void
 *   onSave     — (updatedCustomer) => void
 */
export default function CustomerDrawer({ open, customer, onClose, onSave }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    status: "Active",
    amountOwed: 0,
    sellerDebt: 0,
    notes: "",
  });

  // Pre-fill when customer changes
  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name || "",
        phone: customer.phone || "",
        status: customer.status || "Active",
        amountOwed: customer.amountOwed ?? 0,
        sellerDebt: customer.sellerDebt ?? 0,
        notes: customer.notes || "",
      });
    }
  }, [customer]);

  const handleSave = () => {
    onSave?.({ ...customer, ...form, amountOwed: Number(form.amountOwed), sellerDebt: Number(form.sellerDebt) });
  };

  const isActive = form.status === "Active";

  return (
    <>
      {/* ── Overlay ──────────────────────────────── */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* ── Drawer ───────────────────────────────── */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[430px] bg-white shadow-xl flex flex-col
                    transform transition-transform duration-300 ease-in-out ${
                      open ? "translate-x-0" : "translate-x-full"
                    }`}
      >
        {/* ═══ Header ═════════════════════════════════ */}
        <div className="relative px-6 pt-6 pb-4">
          {/* Accent top line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#229799]" />

          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {customer?.name || "Customer Profile"}
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">Edit Customer</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-gray-100" />

        {/* ═══ Body (scrollable) ══════════════════════ */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-600">Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#229799]/30 focus:border-[#229799] transition-shadow"
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-600">Phone Number</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#229799]/30 focus:border-[#229799] transition-shadow"
            />
          </div>

          {/* Divider */}
          <hr className="border-gray-100" />

          {/* Status Toggle */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-600">Status</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, status: isActive ? "Inactive" : "Active" })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isActive ? "bg-[#229799]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    isActive ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span
                className={`text-sm font-medium ${
                  isActive ? "text-green-600" : "text-gray-500"
                }`}
              >
                {form.status}
              </span>
            </div>
          </div>

          {/* Divider */}
          <hr className="border-gray-100" />

          {/* Amount Owed */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-600">Amount Owed</label>
            <div className="relative">
              <RupeeIcon />
              <input
                type="number"
                min="0"
                value={form.amountOwed}
                onChange={(e) => setForm({ ...form, amountOwed: e.target.value })}
                className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#229799]/30 focus:border-[#229799] transition-shadow"
              />
            </div>
            {Number(form.amountOwed) > 0 && (
              <p className="text-xs text-amber-500 font-medium mt-1">
                ₹{Number(form.amountOwed).toLocaleString("en-IN")} outstanding
              </p>
            )}
          </div>

          {/* Seller Debt */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-600">Seller Debt</label>
            <div className="relative">
              <RupeeIcon />
              <input
                type="number"
                min="0"
                value={form.sellerDebt}
                onChange={(e) => setForm({ ...form, sellerDebt: e.target.value })}
                className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#229799]/30 focus:border-[#229799] transition-shadow"
              />
            </div>
          </div>

          {/* Net Balance Preview */}
          {(() => {
            const net = Number(form.amountOwed || 0) - Number(form.sellerDebt || 0);
            const isNeg = net < 0;
            return (
              <div className={`flex items-center justify-between rounded-lg px-4 py-3 ${
                isNeg ? "bg-red-50" : "bg-amber-50"
              }`}>
                <span className="text-sm text-gray-600">Net Balance</span>
                <span className={`text-base font-bold ${isNeg ? "text-red-600" : "text-amber-600"}`}>
                  {isNeg ? "-" : ""}₹{Math.abs(net).toLocaleString("en-IN")}
                </span>
              </div>
            );
          })()}

          {/* Divider */}
          <hr className="border-gray-100" />

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-600">
              Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Add any notes about this customer…"
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none
                         placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#229799]/30 focus:border-[#229799]
                         transition-shadow"
            />
          </div>
        </div>

        {/* ═══ Footer ═════════════════════════════════ */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="border border-gray-300 text-gray-600 hover:bg-gray-100 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-[#229799] hover:bg-[#1b7f81] text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </>
  );
}
