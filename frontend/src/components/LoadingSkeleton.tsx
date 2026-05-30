export default function LoadingSkeleton() {
  return (
    <div className="w-full space-y-4 animate-pulse">
      {/* Agent log skeleton */}
      <div className="border-2 border-[var(--border-color)] bg-surface-container p-md pt-8 relative rounded-sm">
        <div className="header-tag header-tag--default">AGENT_LOG</div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-4 h-4 bg-surface-variant rounded-sm" />
              <div className="h-3 bg-surface-variant rounded-sm" style={{ width: `${40 + i * 20}%` }} />
            </div>
          ))}
        </div>
      </div>
      {/* Text skeleton */}
      <div className="space-y-2">
        <div className="h-4 bg-surface-variant rounded-sm w-full" />
        <div className="h-4 bg-surface-variant rounded-sm w-4/5" />
        <div className="h-4 bg-surface-variant rounded-sm w-3/5" />
      </div>
    </div>
  )
}
