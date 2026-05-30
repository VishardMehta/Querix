import Icon from '@/components/ui/Icon'

interface TopStatusBarProps {
  fileName: string | null
}

export default function TopStatusBar({ fileName }: TopStatusBarProps) {
  return (
    <div className="w-full border-b-2 border-ink-black bg-surface px-lg py-2 flex justify-end items-center min-h-[44px] shrink-0">
      {fileName && (
        <div className="flex items-center bg-surface-variant border-2 border-ink-black px-sm py-1 gap-2 font-label text-[12px] leading-none tracking-[0.05em] rounded-DEFAULT text-ink-black">
          <Icon name="description" size={14} />
          <span>{fileName} loaded</span>
          <span className="w-2 h-2 rounded-full bg-success animate-pulse ml-2" />
        </div>
      )}
    </div>
  )
}
