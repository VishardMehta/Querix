import type { SessionSnapshot } from '@/App'
import Icon from '@/components/ui/Icon'
import MobileHeader from '@/components/dashboard/MobileHeader'

interface SessionHistoryProps {
  history: SessionSnapshot[]
  onCurrentSession: () => void
  onOpenSession: (session: SessionSnapshot) => void
}

export default function SessionHistory({ history, onCurrentSession, onOpenSession }: SessionHistoryProps) {
  return (
    <>
      <MobileHeader />
      <main className="flex-1 overflow-y-auto bg-surface-cream p-unit-2 md:p-unit-6">
        <div className="max-w-5xl mx-auto">
          <header className="border-b-2 border-ink-black pb-unit-3 mb-unit-6">
            <div className="font-label text-[12px] text-secondary uppercase mb-2">SESSION ARCHIVE</div>
            <h1 className="display-lg text-ink-black">History</h1>
          </header>

          {history.length === 0 ? (
            <section className="bg-surface-container border-2 border-ink-black p-unit-6 max-w-2xl">
              <div className="font-label text-[12px] uppercase tracking-widest text-on-surface-variant mb-3">NO SNAPSHOTS</div>
              <p className="font-body text-[16px] leading-relaxed text-on-background mb-6">
                Start a new chat after working with a dataset and the previous session will be stored here. The app keeps the last two local session summaries.
              </p>
              <button
                className="bg-primary-container text-white border-2 border-ink-black px-6 py-3 font-label text-[12px] uppercase font-bold hard-shadow hard-shadow-hover hard-shadow-active cursor-pointer"
                onClick={onCurrentSession}
              >
                Current Session
              </button>
            </section>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-unit-4">
              {history.map((session) => (
                <article
                  key={session.id}
                  className="bg-surface-container border-2 border-ink-black p-unit-4 hover:bg-surface-variant cursor-pointer"
                  onClick={() => onOpenSession(session)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') onOpenSession(session)
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="min-w-0">
                      <div className="font-label text-[11px] text-secondary uppercase mb-2">
                        {session.createdAt.toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <h2 className="font-headline text-[24px] leading-tight font-semibold text-ink-black break-words">{session.title}</h2>
                    </div>
                    <span className="shrink-0 bg-surface-variant border border-ink-black px-2 py-1 font-label text-[10px] uppercase">
                      {session.messageCount} msgs
                    </span>
                  </div>
                  <div className="space-y-2 font-label text-[12px] text-on-surface-variant">
                    <div className="flex items-center gap-2">
                      <Icon name="description" size={16} />
                      <span className="truncate">{session.datasetName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon name="database" size={16} />
                      <span>{session.files.length} dataset{session.files.length === 1 ? '' : 's'} captured</span>
                    </div>
                  </div>
                  {session.messages.length > 0 && (
                    <div className="mt-5 border-t border-ink-black pt-4 space-y-2">
                      {session.messages.slice(-3).map((message) => (
                        <div key={message.id} className="font-body text-[14px] text-on-surface-variant truncate">
                          <span className="font-label text-[10px] uppercase mr-2 text-primary">{message.role}</span>
                          {message.content}
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
