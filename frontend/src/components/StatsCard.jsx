/**
 * StatsCard — Reusable metric card for the dashboard/customers page.
 *
 * @param {string}        label  – Metric label (e.g. "Total Customers")
 * @param {string|number} value  – Display value
 * @param {ReactNode}     icon   – Icon / emoji placeholder
 * @param {string}        iconBg – Tailwind bg class for the icon circle
 */
export default function StatsCard({ label, value, icon, iconBg = "bg-cyan-50" }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
      {/* Icon circle */}
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${iconBg}`}
      >
        {icon}
      </div>

      {/* Text */}
      <div>
        <p className="text-sm text-gray-500 leading-tight">{label}</p>
        <p className="text-2xl font-bold text-gray-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
