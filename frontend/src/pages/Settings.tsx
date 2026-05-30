import { useRef, useState } from 'react'
import Icon from '@/components/ui/Icon'
import MobileHeader from '@/components/dashboard/MobileHeader'
import type { Theme, UserProfile } from '@/App'

interface SettingsProps {
  theme: Theme
  profile: UserProfile
  onThemeChange: (theme: Theme) => void
  onProfileChange: (profile: UserProfile) => void
}

export default function Settings({ theme, profile, onThemeChange, onProfileChange }: SettingsProps) {
  const [draft, setDraft] = useState(profile)
  const [saved, setSaved] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const updateDraft = (key: keyof UserProfile, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setSaved(false)
  }

  const handleAvatar = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') updateDraft('avatarUrl', reader.result)
    }
    reader.readAsDataURL(file)
  }

  const saveProfile = () => {
    onProfileChange(draft)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2500)
  }

  return (
    <>
      <MobileHeader />
      <main className="flex-1 overflow-y-auto p-unit-2 md:p-unit-8 bg-surface w-full">
        <div className="max-w-6xl mx-auto space-y-unit-8">
          <header className="mb-unit-6 pb-unit-3">
            <h2 className="font-headline text-[48px] md:text-6xl leading-tight font-bold text-ink-black">System Settings</h2>
            <p className="font-body text-[16px] text-on-surface-variant mt-2 max-w-2xl">
              Manage your environment configurations, connections, and user preferences with technical precision.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <section className="lg:col-span-8 brutalist-border bg-surface-cream relative p-8">
              <SectionTag label="ACCOUNT_PROFILE" />
              <div className="flex flex-col md:flex-row items-start md:space-x-8 mt-4">
                <button
                  className="group w-32 h-32 brutalist-border bg-surface-variant flex-shrink-0 relative mb-6 md:mb-0 overflow-hidden cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                  title="Update profile picture"
                >
                  <img
                    alt="Profile avatar"
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                    src={draft.avatarUrl}
                  />
                  <span className="absolute inset-0 bg-black/55 text-white font-label text-[11px] uppercase tracking-widest hidden group-hover:flex items-center justify-center gap-2">
                    <Icon name="edit" size={16} /> Edit
                  </span>
                </button>
                <input
                  ref={fileInputRef}
                  className="hidden"
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleAvatar(event.target.files?.[0])}
                />
                <div className="flex-1 space-y-6 w-full">
                  <Field label="Display Name" value={draft.displayName} onChange={(value) => updateDraft('displayName', value)} />
                  <Field label="Email Address" value={draft.email} type="email" onChange={(value) => updateDraft('email', value)} />
                  <Field label="Agent Label" value={draft.agentName} mono onChange={(value) => updateDraft('agentName', value.toUpperCase())} />
                  <button className="bg-surface-cream text-ink-black brutalist-border px-8 py-3 font-label text-[12px] uppercase font-bold hard-shadow hard-shadow-hover hard-shadow-active hover:bg-surface cursor-pointer" onClick={saveProfile}>
                    Update Profile
                  </button>
                  {saved && <span className="ml-4 font-label text-[11px] uppercase text-success">Profile saved</span>}
                </div>
              </div>
            </section>

            <section className="lg:col-span-4 brutalist-border bg-surface-cream relative p-8">
              <SectionTag label="UI_THEME" />
              <div className="mt-4 space-y-6">
                <p className="font-body text-[16px] text-on-surface-variant">Select your interface preference.</p>
                <div className="space-y-3">
                  <button
                    className={[
                      'w-full flex items-center justify-between p-4 brutalist-border cursor-pointer',
                      theme === 'light' ? 'bg-surface hard-shadow hard-shadow-hover' : 'bg-surface-container hover:bg-surface-variant',
                    ].join(' ')}
                    onClick={() => onThemeChange('light')}
                  >
                    <span className="font-label text-[12px] uppercase text-ink-black font-bold flex items-center">
                      <Icon name="light_mode" size={20} className="mr-2" /> Light Mode
                    </span>
                    <div className={['w-4 h-4 rounded-full brutalist-border', theme === 'light' ? 'bg-electric-blue' : 'bg-transparent'].join(' ')} />
                  </button>
                  <button
                    className={[
                      'w-full flex items-center justify-between p-4 brutalist-border cursor-pointer',
                      theme === 'dark' ? 'bg-surface hard-shadow hard-shadow-hover' : 'bg-surface-variant hover:bg-surface',
                    ].join(' ')}
                    onClick={() => onThemeChange('dark')}
                  >
                    <span className="font-label text-[12px] uppercase text-ink-black font-bold flex items-center">
                      <Icon name="dark_mode" size={20} className="mr-2" /> Dark Mode
                    </span>
                    <div className={['w-4 h-4 rounded-full brutalist-border', theme === 'dark' ? 'bg-electric-blue' : 'bg-transparent'].join(' ')} />
                  </button>
                </div>
                <p className="font-label text-secondary font-bold text-[10px] uppercase tracking-wider">Theme preference is saved locally.</p>
              </div>
            </section>

            <section className="lg:col-span-6 brutalist-border bg-surface-cream relative p-8">
              <SectionTag label="GLOBAL_PREFS" />
              <div className="space-y-6 mt-4">
                <SelectField label="Language" options={['English (US)', 'English (UK)', 'Spanish', 'French']} />
                <SelectField label="Timezone" options={['UTC - Coordinated Universal Time', 'EST - Eastern Standard Time', 'PST - Pacific Standard Time']} />
              </div>
            </section>

            <section className="lg:col-span-6 brutalist-border bg-surface-cream relative p-8">
              <SectionTag label="API_CONNECT" />
              <div className="space-y-6 mt-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-label text-xs uppercase bg-secondary/15 brutalist-border px-3 py-1 font-bold">MCP SERVER</span>
                  <span className="font-label text-xs uppercase bg-surface-variant border border-ink-black px-3 py-1 flex items-center text-secondary font-bold">
                    <Icon name="link_off" size={14} className="mr-1" /> DISCONNECTED
                  </span>
                </div>
                <Field label="Endpoint URL" value="https://api.provider.com/v1" mono />
                <div className="space-y-1">
                  <label className="font-label text-[12px] uppercase text-ink-black font-bold block">Access Token</label>
                  <div className="flex">
                    <input className="flex-1 bg-surface-cream brutalist-border border-r-0 p-4 font-label text-[12px] focus:ring-0" type="password" value="*************************" readOnly />
                    <button className="bg-surface-variant brutalist-border px-4 border-l-0 hover:bg-surface hover:text-electric-blue cursor-pointer">
                      <Icon name="visibility" size={22} />
                    </button>
                  </div>
                </div>
                <button className="bg-electric-blue text-white brutalist-border px-8 py-4 font-label text-[12px] uppercase font-bold hard-shadow hard-shadow-hover hard-shadow-active w-full hover:bg-primary cursor-pointer">
                  Test Connection
                </button>
              </div>
            </section>
          </div>

          <div className="flex justify-end pt-8 pb-16">
            <button className="bg-electric-blue text-white brutalist-border px-12 py-4 font-label text-xl uppercase font-bold hard-shadow hard-shadow-hover hard-shadow-active hover:bg-primary cursor-pointer">
              Save All Changes
            </button>
          </div>
        </div>
      </main>
    </>
  )
}

function SectionTag({ label }: { label: string }) {
  return (
    <span className="bg-ink-black text-surface-cream font-label text-[12px] px-2 py-0.5 uppercase inline-block absolute -top-3 left-4">
      {label}
    </span>
  )
}

function Field({ label, value, type = 'text', mono = false, onChange }: { label: string; value: string; type?: string; mono?: boolean; onChange?: (value: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="font-label text-[12px] uppercase text-ink-black font-bold block">{label}</label>
      <input
        className={['w-full bg-surface-cream brutalist-border p-4 text-[16px] focus:ring-0 hover:bg-surface', mono ? 'font-label text-[12px]' : 'font-body'].join(' ')}
        type={type}
        value={value}
        readOnly={!onChange}
        onChange={(event) => onChange?.(event.target.value)}
      />
    </div>
  )
}

function SelectField({ label, options }: { label: string; options: string[] }) {
  return (
    <div className="space-y-1">
      <label className="font-label text-[12px] uppercase text-ink-black font-bold block">{label}</label>
      <select className="w-full bg-surface-cream brutalist-border p-4 font-body text-[16px] focus:ring-0 rounded-none hover:bg-surface cursor-pointer">
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </div>
  )
}
