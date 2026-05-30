import Icon from '@/components/ui/Icon'

export default function MobileHeader() {
  return (
    <header className="md:hidden flex justify-between items-center w-full px-md h-16 bg-surface-container border-b-2 border-ink-black shrink-0 relative z-10">
      <button className="p-2 border-2 border-ink-black hover:bg-surface-variant rounded-DEFAULT">
        <Icon name="menu" size={24} />
      </button>
      <h2 className="headline-md text-[20px] uppercase tracking-tight text-on-background">TALK TO DATA</h2>
      <div className="w-10" />
    </header>
  )
}
