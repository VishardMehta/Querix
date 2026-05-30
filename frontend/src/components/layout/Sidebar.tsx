import type { AppView, UserProfile } from '@/App'
import Icon from '@/components/ui/Icon'

interface SidebarProps {
  activeView: AppView
  collapsed: boolean
  historyCount: number
  profile: UserProfile
  onToggleCollapsed: () => void
  onNavigate: (view: AppView) => void
  onNewChat: () => void
}

const navItems: Array<{ view: AppView; label: string; icon: string }> = [
  { view: 'dashboard', label: 'Current Session', icon: 'chat' },
  { view: 'workspace', label: 'Data Workspace', icon: 'database' },
  { view: 'history', label: 'History', icon: 'history' },
]

export default function Sidebar({ activeView, collapsed, historyCount, profile, onToggleCollapsed, onNavigate, onNewChat }: SidebarProps) {
  return (
    <nav
      className={[
        'hidden md:flex flex-col h-screen p-md space-y-md bg-surface-container border-r-2 border-ink-black shrink-0 relative z-20 overflow-hidden transition-[width,padding] duration-300',
        collapsed ? 'w-20' : 'w-72',
      ].join(' ')}
    >
      <div className={['mb-lg pt-sm px-xs flex items-start', collapsed ? 'justify-center' : 'justify-between'].join(' ')}>
        {!collapsed && (
          <div>
            <h1 className="headline-md text-on-background tracking-tight mb-2 uppercase">Querix</h1>
            <p className="font-label text-[12px] leading-none tracking-[0.05em] text-on-surface-variant uppercase">v2.4 active</p>
          </div>
        )}
        <button
          className="p-1 border-2 border-ink-black hover:bg-surface-variant rounded-DEFAULT text-on-background shrink-0 cursor-pointer"
          onClick={onToggleCollapsed}
          title={collapsed ? 'Open sidebar' : 'Collapse sidebar'}
        >
          <Icon name={collapsed ? 'menu' : 'menu_open'} size={18} />
        </button>
      </div>

      <div className="mb-md">
        <button
          className="w-full bg-primary-container text-white font-label uppercase px-md py-sm border-2 border-ink-black hard-shadow hard-shadow-hover hard-shadow-active rounded-DEFAULT flex items-center justify-center gap-2 cursor-pointer"
          onClick={onNewChat}
          title="New Chat"
        >
          <Icon name="add_circle" size={18} />
          {!collapsed && <span>New Chat</span>}
        </button>
      </div>

      <div className="flex-grow space-y-sm overflow-hidden">
        {!collapsed && (
          <div className="font-label text-[10px] text-on-surface-variant mb-2 px-2 uppercase tracking-widest">Menu</div>
        )}
        {navItems.map((item) => {
          const active = activeView === item.view
          return (
            <button
              key={item.view}
              className={[
                'flex items-center py-sm w-full border-2 font-label text-[12px] leading-none tracking-[0.05em] uppercase rounded-DEFAULT cursor-pointer',
                collapsed ? 'justify-center px-0' : 'px-sm',
                active
                  ? 'text-primary font-bold bg-surface-variant border-ink-black'
                  : 'text-on-background border-transparent hover:bg-surface-variant hover:border-ink-black',
              ].join(' ')}
              onClick={() => onNavigate(item.view)}
              title={item.label}
            >
              <Icon name={item.icon} size={20} className={collapsed ? '' : 'mr-md'} />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && item.view === 'history' && historyCount > 0 && (
                <span className="ml-auto rounded-full bg-primary-container text-white px-2 py-0.5 text-[10px]">{historyCount}</span>
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-auto space-y-sm pt-md border-t-2 border-ink-black">
        <button
          className={[
            'flex items-center py-sm w-full text-on-background hover:bg-surface-variant border-2 border-transparent hover:border-ink-black font-label text-[12px] leading-none tracking-[0.05em] uppercase rounded-DEFAULT cursor-pointer',
            collapsed ? 'justify-center px-0' : 'px-sm',
            activeView === 'settings' ? 'bg-surface-variant border-ink-black text-primary font-bold' : '',
          ].join(' ')}
          onClick={() => onNavigate('settings')}
          title="Settings"
        >
          <Icon name="settings" size={20} className={collapsed ? '' : 'mr-md'} />
          {!collapsed && <span className="truncate">Settings</span>}
        </button>
        <button
          className={['flex items-center py-sm w-full text-on-background hover:bg-surface-variant border-2 border-transparent hover:border-ink-black font-label text-[12px] leading-none tracking-[0.05em] uppercase rounded-DEFAULT cursor-pointer', collapsed ? 'justify-center px-0' : 'px-sm'].join(' ')}
          title="Support"
        >
          <Icon name="help" size={20} className={collapsed ? '' : 'mr-md'} />
          {!collapsed && <span className="truncate">Support</span>}
        </button>
      </div>

      <div className={['mt-sm pt-sm border-t-2 border-ink-black flex items-center', collapsed ? 'flex-col justify-center gap-2' : 'justify-between'].join(' ')}>
        <div className={['flex items-center', collapsed ? 'flex-col' : ''].join(' ')}>
          <div className={['w-10 h-10 border-2 border-ink-black bg-surface-variant overflow-hidden rounded-DEFAULT shrink-0', collapsed ? 'mb-2' : 'mr-3'].join(' ')}>
            <img
              alt={profile.displayName}
              className="w-full h-full object-cover grayscale"
              src={profile.avatarUrl}
            />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-label text-[12px] leading-none tracking-[0.05em] font-bold text-ink-black">{profile.agentName}</span>
              <span className="font-label text-[12px] leading-none tracking-[0.05em] text-secondary mt-1">Online</span>
            </div>
          )}
        </div>
        <button className="w-8 h-8 flex items-center justify-center border-2 border-ink-black hover:bg-surface-variant rounded-DEFAULT text-on-background shrink-0 cursor-pointer">
          <Icon name="logout" size={16} />
        </button>
      </div>
    </nav>
  )
}
