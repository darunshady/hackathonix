/**
 * BalancePreview — Shows the customer/supplier running balance
 * before and after the current transaction.
 *
 * Props:
 *   currentBalance  — number (positive = they owe you, negative = you owe them)
 *   transactionAmt  — number (grand total of this invoice)
 *   invoiceType     — "selling" | "buying"
 *   partyName       — string (customer or supplier name)
 */

const ArrowIcon = () => (
  <svg className="w-4 h-4 mx-auto text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
  </svg>
);

export default function BalancePreview({
  currentBalance = 0,
  transactionAmt = 0,
  invoiceType = "selling",
  partyName = "",
}) {
  // Selling → customer owes more (balance increases)
  // Buying  → you owe supplier more (balance decreases)
  const afterBalance =
    invoiceType === "selling"
      ? currentBalance + transactionAmt
      : currentBalance - transactionAmt;

  const fmtCurrency = (val) => {
    const abs = Math.abs(val);
    const str = abs.toLocaleString("en-IN", { minimumFractionDigits: 0 });
    return `₹${str}`;
  };

  const balanceLabel = (val) => {
    if (val > 0) return { text: "They owe you", color: "text-green-600" };
    if (val < 0) return { text: "You owe them", color: "text-red-500" };
    return { text: "Settled", color: "text-gray-500" };
  };

  const before = balanceLabel(currentBalance);
  const after = balanceLabel(afterBalance);

  if (!transactionAmt) return null;

  return (
    <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 p-4 space-y-3">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Balance Preview{partyName ? ` — ${partyName}` : ""}
      </h4>

      <div className="flex items-center gap-3">
        {/* Current balance */}
        <div className="flex-1 text-center">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Current</p>
          <p className={`text-lg font-bold ${before.color}`}>{fmtCurrency(currentBalance)}</p>
          <p className={`text-[10px] ${before.color}`}>{before.text}</p>
        </div>

        {/* Arrow */}
        <ArrowIcon />

        {/* After balance */}
        <div className="flex-1 text-center">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">After</p>
          <p className={`text-lg font-bold ${after.color}`}>{fmtCurrency(afterBalance)}</p>
          <p className={`text-[10px] ${after.color}`}>{after.text}</p>
        </div>
      </div>
    </div>
  );
}
