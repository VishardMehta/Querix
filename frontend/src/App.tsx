import { useCallback, useEffect, useState } from 'react'
import { useAppStore, type Message, type UploadedFileInfo } from '@/store/useAppStore'
import { clearSession, fetchProfile, saveProfile } from '@/lib/api'
import Sidebar from '@/components/layout/Sidebar'
import Dashboard from '@/pages/Dashboard'
import DataWorkspace from '@/pages/DataWorkspace'
import Settings from '@/pages/Settings'
import SessionHistory from '@/pages/SessionHistory'

export type AppView = 'dashboard' | 'workspace' | 'history' | 'settings'
export type Theme = 'light' | 'dark'

export interface UserProfile {
  displayName: string
  email: string
  agentName: string
  avatarUrl: string
}

const DEFAULT_PROFILE: UserProfile = {
  displayName: 'System Admin',
  email: 'admin@talktodata.app',
  agentName: 'AGENT_01',
  avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCRy1Vdbc5ueEuxAM5K2NTcZKz5wXekgBOPtmGp_MT1p8o1hBZSPmue2hdmUmegAnFaEA3LJjarxa2SVf0hyu8x1kgebY7QqwTcCafSEVIcrfAwHJFzAypf_baMmhmdTlBn6y9g6OfRaF9d8-Y9EgHwIWFSl-on8Rc0UbYd2uiCAF-fnZ_2l4qLEFpz5Ccx8sGInJVjgjSSLNWSQ6ydH0jtmuYP-qsQ2G85GVpHOb9LKd87_b2joMZX5u5I0762bqXJD4E2fmBs2nw',
}

export interface SessionSnapshot {
  id: string
  title: string
  datasetName: string
  messageCount: number
  createdAt: Date
  messages: Message[]
  files: UploadedFileInfo[]
}

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('ttd-theme')
    return stored === 'dark' ? 'dark' : 'light'
  })
  const [history, setHistory] = useState<SessionSnapshot[]>([])
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem('querix-profile')
      return stored ? { ...DEFAULT_PROFILE, ...JSON.parse(stored) } : DEFAULT_PROFILE
    } catch {
      return DEFAULT_PROFILE
    }
  })
  const {
    sessionId,
    resetSession,
    setMessages,
    setUploadedFiles,
    setUploadedFile,
    setUploadInfo,
    setDataSource,
    setUploadError,
    clearThinkingSteps,
  } = useAppStore()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('ttd-theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('querix-profile', JSON.stringify(profile))
  }, [profile])

  useEffect(() => {
    let cancelled = false
    fetchProfile().then((remoteProfile) => {
      if (!cancelled && remoteProfile) {
        setProfile({
          ...DEFAULT_PROFILE,
          ...remoteProfile,
          avatarUrl: remoteProfile.avatarUrl || DEFAULT_PROFILE.avatarUrl,
        })
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const handleProfileChange = useCallback((nextProfile: UserProfile) => {
    setProfile(nextProfile)
    void saveProfile(nextProfile)
  }, [])

  const handleNewChat = useCallback(async () => {
    const state = useAppStore.getState()
    const readyFiles = state.uploadedFiles.filter((file) => file.rows > 0)
    if (state.messages.length > 0 || readyFiles.length > 0) {
      const firstQuestion = state.messages.find((message) => message.role === 'user')?.content
      const datasetName = readyFiles[0]?.file.name ?? state.uploadedFile?.name ?? 'Untitled dataset'
      setHistory((prev) => [
        {
          id: `${Date.now()}`,
          title: firstQuestion ? firstQuestion.slice(0, 72) : datasetName,
          datasetName,
          messageCount: state.messages.length,
          createdAt: new Date(),
          messages: state.messages,
          files: readyFiles,
        },
        ...prev,
      ].slice(0, 2))
    }
    if (sessionId) await clearSession(sessionId)
    resetSession()
    setActiveView('dashboard')
  }, [resetSession, sessionId])

  const handleOpenHistory = useCallback((snapshot: SessionSnapshot) => {
    setMessages(snapshot.messages)
    setUploadedFiles(snapshot.files)
    const firstFile = snapshot.files[0]
    setUploadedFile(firstFile?.file ?? null)
    setUploadInfo(firstFile ? { rows: firstFile.rows, columns: firstFile.columns } : null)
    const ext = firstFile?.file.name.split('.').pop()?.toLowerCase()
    setDataSource(ext === 'json' ? 'json' : ext === 'db' || ext === 'sqlite' || ext === 'sqlite3' ? 'database' : firstFile ? 'csv' : null)
    setUploadError(null)
    clearThinkingSteps()
    setActiveView('dashboard')
  }, [clearThinkingSteps, setDataSource, setMessages, setUploadError, setUploadInfo, setUploadedFile, setUploadedFiles])

  return (
    <div className="h-screen overflow-hidden bg-surface-cream text-on-background font-body flex selection:bg-primary-container selection:text-white">
      <Sidebar
        activeView={activeView}
        collapsed={sidebarCollapsed}
        historyCount={history.length}
        profile={profile}
        onToggleCollapsed={() => setSidebarCollapsed((value) => !value)}
        onNavigate={setActiveView}
        onNewChat={handleNewChat}
      />
      <div className="flex min-w-0 flex-1 flex-col h-screen relative bg-surface-cream">
        {activeView === 'workspace' ? (
          <DataWorkspace onUploadRequest={() => setActiveView('dashboard')} />
        ) : activeView === 'settings' ? (
          <Settings theme={theme} profile={profile} onThemeChange={setTheme} onProfileChange={handleProfileChange} />
        ) : activeView === 'history' ? (
          <SessionHistory history={history} onCurrentSession={() => setActiveView('dashboard')} onOpenSession={handleOpenHistory} />
        ) : (
          <Dashboard activeView={activeView} onNavigate={setActiveView} />
        )}
      </div>
    </div>
  )
}
