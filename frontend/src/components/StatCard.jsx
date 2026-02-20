import { Link } from "react-router-dom";

/**
 * StatCard — Clean KPI metric card with cyan icon accent.
 *
 * Accepts `title` (preferred) or `label` for the heading text.
 * Optional props (subtitle, trend, to) kept for backward compat
 * with the Dashboard page.
 */
export default function StatCard({
  title,
  label,
  value,
  subtitle,
  subtitleColor = "text-gray-400",
  trend,
  trendColor = "text-emerald-500",
  icon,
  iconBg = "bg-[#229799]/10",
  to,
}) {
  const heading = title || label;

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

  const content = (
    <>
      {/* Icon circle */}
      {icon && (
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}
        >
          {icon}
        </div>
      )}

      {/* Text content */}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-500">{heading}</p>
        <p className="mt-1 text-2xl font-bold text-gray-800 leading-tight">{value}</p>

        {/* Optional subtitle + trend arrow */}
        {(subtitle || trend) && (
          <div className="mt-1.5 flex items-center gap-1.5">
            {subtitle && (
              <span className={`text-xs font-medium ${subtitleColor}`}>{subtitle}</span>
            )}
            {arrow}
          </div>
        )}
      </div>
    </>
  );

  const cls =
    "bg-white rounded-2xl shadow-sm p-6 flex items-center gap-4 hover:shadow-md transition-shadow";

  return to ? (
    <Link to={to} className={`group ${cls}`}>
      {content}
    </Link>
  ) : (
    <div className={cls}>{content}</div>
  );
}
