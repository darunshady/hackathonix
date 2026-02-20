import { Link } from "react-router-dom";

/**
 * StatCard — A single metric card for the dashboard.
 *
 * @param {string}        label       – Metric label text
 * @param {string|number} value       – Large display value
 * @param {string}        subtitle    – Small helper text below value
 * @param {string}        subtitleColor – Tailwind text colour for subtitle
 * @param {"up"|"down"|null} trend    – Arrow direction indicator
 * @param {string}        trendColor  – Tailwind text colour for the arrow
 * @param {ReactNode}     icon        – Icon element
 * @param {string}        iconBg      – Tailwind bg class for icon circle
 * @param {string}        to          – React Router link target
 * @param {string}        accentBorder – Tailwind border-t colour accent
 */
export default function StatCard({
  label,
  value,
  subtitle,
  subtitleColor = "text-gray-400",
  trend,
  trendColor = "text-emerald-500",
  icon,
  iconBg = "bg-cyan-50",
  to = "/",
  accentBorder = "border-transparent",
}) {
  const arrow =
    trend === "up" ? (
      <svg className={`w-4 h-4 ${trendColor}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
      </svg>
    ) : trend === "down" ? (
      <svg className={`w-4 h-4 ${trendColor}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5l15 15m0 0V8.25m0 11.25H8.25" />
      </svg>
    ) : null;

  return (
    <Link
      to={to}
      className={`group bg-white rounded-2xl shadow-sm border border-gray-100 ${accentBorder} border-t-2
                  p-6 flex items-start gap-4 hover:shadow-md transition-shadow`}
    >
      {/* Icon circle */}
      {icon && (
        <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
          {icon}
        </div>
      )}

      {/* Text content */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-gray-800 leading-tight">{value}</p>

        {/* Subtitle + trend arrow */}
        {(subtitle || trend) && (
          <div className="mt-1.5 flex items-center gap-1.5">
            {subtitle && (
              <span className={`text-xs font-medium ${subtitleColor}`}>{subtitle}</span>
            )}
            {arrow}
          </div>
        )}
      </div>
    </Link>
  );
}
