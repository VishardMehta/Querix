interface StatCardProps {
  label: string
  value: string
  change?: string
  trend?: 'up' | 'down' | 'neutral'
}

export default function StatCard({ label, value, change, trend }: StatCardProps) {
  return (
    <div className="border-2 border-[var(--border-color)] bg-surface-container p-md relative rounded-sm">
      {/* Header tag */}
      <div className="header-tag header-tag--default">
        METRIC
      </div>
      <div className="pt-4">
        <p className="text-label-md text-on-surface-variant uppercase mb-2">{label}</p>
        <p className="font-label text-[28px] font-bold text-on-background leading-tight">
          {value}
        </p>
        {change && (
          <p className={`text-label-md mt-2 ${
            trend === 'up' ? 'text-status-green' : trend === 'down' ? 'text-error' : 'text-on-surface-variant'
          }`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {change}
          </p>
        )}
      </div>
    </div>
  )
}
