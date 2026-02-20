import { useEffect, useState } from "react";
import db from "../db";

/**
 * TopDebtors — Right-panel list showing customers with the
 * highest pending amounts (live from IndexedDB).
 */
export default function TopDebtors() {
  const [debtors, setDebtors] = useState([]);

  useEffect(() => {
    (async () => {
      const customers = await db.customers.toArray();
      // Sort by amountOwed descending, take top 5
      const sorted = customers
        .filter((c) => (c.amountOwed ?? 0) > 0)
        .sort((a, b) => (b.amountOwed ?? 0) - (a.amountOwed ?? 0))
        .slice(0, 5)
        .map((c) => ({ name: c.name, amount: c.amountOwed ?? 0 }));
      setDebtors(sorted);
    })();
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Debtors</h3>

      {debtors.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No outstanding debts.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {debtors.map((d, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3"
            >
              <span className="text-sm font-medium text-gray-700">{d.name}</span>
              <span className="text-sm font-bold text-amber-600">
                ₹{d.amount.toLocaleString("en-IN")}
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center mt-4">Based on current balances</p>
    </div>
  );
}
