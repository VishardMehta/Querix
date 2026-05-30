import type { MetricCard } from '@/types'
import StatCard from './StatCard'

interface MetricCardsProps {
  metrics: MetricCard[]
}

export default function MetricCards({ metrics }: MetricCardsProps) {
  if (!metrics || metrics.length === 0) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
      {metrics.map((metric, i) => (
        <StatCard
          key={i}
          label={metric.label}
          value={metric.value}
          change={metric.change}
          trend={metric.trend}
        />
      ))}
    </div>
  )
}
