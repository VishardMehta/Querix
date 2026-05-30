import { type KeyboardEvent, type RefObject } from 'react'
import Icon from '@/components/ui/Icon'

interface CommandBarProps {
  value: string
  canSubmit: boolean
  disabled: boolean
  placeholder: string
  textareaRef: RefObject<HTMLTextAreaElement | null>
  onChange: (value: string) => void
  onSubmit: () => void
  onUploadClick: () => void
}

export default function CommandBar({
  value,
  canSubmit,
  disabled,
  placeholder,
  textareaRef,
  onChange,
  onSubmit,
  onUploadClick,
}: CommandBarProps) {
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      onSubmit()
    }
  }

  return (
    <footer className="absolute bottom-0 left-0 w-full bg-surface border-t-2 border-ink-black p-md md:p-lg z-20">
      <div className="max-w-[680px] mx-auto relative flex items-end gap-4">
        <div className="flex-1 relative flex flex-col bg-surface-container border-2 border-ink-black focus-within:border-primary rounded-DEFAULT">
          <div className="flex items-end w-full">
            <button
              className="p-4 text-on-surface-variant hover:text-primary flex items-center justify-center h-full cursor-pointer"
              onClick={onUploadClick}
              title="Attach file"
            >
              <Icon name="attach_file" size={24} />
            </button>
            <textarea
              ref={textareaRef}
              className="flex-1 w-full bg-transparent border-none focus:ring-0 resize-none py-4 px-2 font-body text-[16px] placeholder:text-on-surface-variant text-ink-black max-h-[120px] overflow-y-auto"
              placeholder={placeholder}
              rows={1}
              value={value}
              disabled={disabled}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={onKeyDown}
              style={{ minHeight: 56 }}
            />
          </div>
        </div>
        <button
          className={[
            'h-14 px-lg border-2 border-ink-black font-label font-bold uppercase tracking-widest hard-shadow flex items-center justify-center gap-2 shrink-0 rounded-DEFAULT group cursor-pointer',
            canSubmit ? 'bg-primary-container text-white hard-shadow-hover hard-shadow-active hover:bg-inverse-primary' : 'bg-surface-variant text-on-surface-variant cursor-not-allowed',
          ].join(' ')}
          disabled={!canSubmit}
          onClick={onSubmit}
        >
          <span className="hidden sm:inline">Execute</span>
          <Icon name="send" size={22} className={canSubmit ? 'group-hover:translate-x-1 transition-transform' : ''} />
        </button>
      </div>
      <div className="text-center mt-4 font-label text-[10px] text-on-surface-variant uppercase tracking-widest">
        Data processed securely. AI predictions are estimates.
      </div>
    </footer>
  )
}
