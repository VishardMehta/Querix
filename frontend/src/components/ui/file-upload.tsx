import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import Icon from '@/components/ui/Icon'

const ACCEPTED_TYPES = '.csv,.tsv,.json,.jsonl,.parquet,.xlsx,.xls,.db,.sqlite,.sqlite3'

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void
  onFileSelected?: (file: File) => void
  onClose: () => void
}

export default function FileUpload({ onFilesSelected, onFileSelected, onClose }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setDragging] = useState(false)

  const handleFiles = (fileList: FileList | File[]) => {
    const files = Array.from(fileList)
    if (!files.length) return
    onFilesSelected(files)
    if (onFileSelected && files.length === 1) onFileSelected(files[0])
    if (inputRef.current) inputRef.current.value = ''
    onClose()
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    handleFiles(event.dataTransfer.files)
  }

  const onSelect = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) handleFiles(event.target.files)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section className="w-full max-w-[560px] max-h-[calc(100vh-64px)] overflow-auto bg-surface-container border-2 border-ink-black rounded-DEFAULT hard-shadow">
        <header className="flex items-start justify-between gap-4 px-md py-md border-b-2 border-ink-black bg-surface-bright">
          <div className="min-w-0">
            <h2 className="font-headline text-[24px] leading-tight font-semibold text-ink-black">Upload Data</h2>
            <p className="font-label text-[11px] text-on-surface-variant mt-2 uppercase tracking-widest">
              CSV, JSON, Parquet, Excel, SQLite
            </p>
          </div>
          <button
            className="w-9 h-9 flex items-center justify-center border-2 border-ink-black hover:bg-surface-variant rounded-DEFAULT text-on-background cursor-pointer shrink-0"
            onClick={onClose}
            title="Close"
          >
            <Icon name="close" size={18} />
          </button>
        </header>

        <div className="p-md">
          <div
            className={[
              'min-h-[260px] w-full border-2 border-dashed p-xl flex flex-col items-center justify-center text-center cursor-pointer bg-surface-container-low',
              isDragging ? 'border-primary bg-primary-container/10' : 'border-ink-black hover:bg-surface-variant',
            ].join(' ')}
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <Icon name="cloud_upload" size={52} className={isDragging ? 'text-primary' : 'text-on-surface-variant'} />
            <p className="font-body text-[18px] font-semibold text-ink-black mt-4">
              {isDragging ? 'Drop files here' : 'Drop data files here'}
            </p>
            <p className="font-body text-[15px] text-on-surface-variant mt-2 max-w-[360px]">
              Click to browse or drag files into this panel. Multiple files are supported.
            </p>
            <button className="mt-6 bg-primary-container text-white border-2 border-ink-black px-5 py-2 font-label text-[12px] uppercase font-bold hard-shadow hard-shadow-hover hard-shadow-active">
              Browse Files
            </button>
            <input ref={inputRef} hidden multiple type="file" accept={ACCEPTED_TYPES} onChange={onSelect} />
          </div>
        </div>
      </section>
    </div>
  )
}
