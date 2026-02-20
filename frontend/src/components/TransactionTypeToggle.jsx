/**
 * TransactionTypeToggle — Segmented pill toggle to switch between
 * "Selling" (you sold goods/services) and "Buying" (you purchased).
 *
 * Props:
 *   value    — "selling" | "buying"
 *   onChange — (type) => void
 */

const SellIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
  </svg>
);

const BuyIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
  </svg>
);

export default function TransactionTypeToggle({ value, onChange }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <label className="text-sm font-medium text-gray-600 mb-2 block">Transaction Type</label>
      <div className="flex rounded-xl bg-gray-100 p-1 gap-1">
        {/* Selling */}
        <button
          type="button"
          onClick={() => onChange("selling")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            value === "selling"
              ? "bg-[#229799] text-white shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <SellIcon />
          Selling
        </button>

        {/* Buying */}
        <button
          type="button"
          onClick={() => onChange("buying")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            value === "buying"
              ? "bg-orange-500 text-white shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <BuyIcon />
          Buying
        </button>
      </div>

      {/* Helper text */}
      <p className="text-xs text-gray-400 mt-2">
        {value === "selling"
          ? "You sold goods / services → customer owes you"
          : "You purchased goods / services → you owe the supplier"}
      </p>
    </div>
  );
}
