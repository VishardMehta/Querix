import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import type { AppView } from '@/App'
import { useAppStore, type DataSource } from '@/store/useAppStore'
import { generateId } from '@/lib/utils'
import {
  checkBackendHealth,
  clearSession,
  removeUploadedTable,
  streamQuery,
  uploadFilesWithProgress,
  type UploadProgressEvent,
} from '@/lib/api'
import type { QueryResult, ThinkingStep } from '@/types'
import ChatMessage from '@/components/ChatMessage'
import ThinkingDisplay from '@/components/ThinkingDisplay'
import FileUpload from '@/components/ui/file-upload'
import Icon from '@/components/ui/Icon'
import CommandBar from '@/components/dashboard/CommandBar'
import MobileHeader from '@/components/dashboard/MobileHeader'
import TopStatusBar from '@/components/dashboard/TopStatusBar'

interface DashboardProps {
  activeView: AppView
  onNavigate: (view: AppView) => void
}

export default function Dashboard({ activeView, onNavigate }: DashboardProps) {
  const {
    messages,
    addMessage,
    isLoading,
    setLoading,
    isUploading,
    setUploading,
    uploadError,
    setUploadError,
    dataSource,
    setDataSource,
    uploadedFile,
    setUploadedFile,
    uploadedFiles,
    setUploadedFiles,
    sessionId,
    backendAvailable,
    setBackendAvailable,
    thinkingSteps,
    addThinkingStep,
    updateThinkingStep,
    clearThinkingSteps,
    resetForNewDataset,
    setUploadInfo,
    setSuggestedQuestions,
    clearChat,
  } = useAppStore()

  const [inputValue, setInputValue] = useState('')
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<UploadProgressEvent | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const mainRef = useRef<HTMLElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const uploadOpsRef = useRef(0)
  const abortRef = useRef<(() => void) | null>(null)

  const readyFiles = uploadedFiles.filter((file) => file.rows > 0)
  const uploadReady = readyFiles.length > 0
  const hasPendingFiles = uploadedFiles.some((file) => file.rows === 0)
  const contextFileName = readyFiles[0]?.file.name ?? uploadedFile?.name ?? null
  const canSubmit = inputValue.trim().length > 0 && !isLoading && !isUploading && uploadReady
  const isDashboardLike = activeView === 'dashboard'

  useEffect(() => {
    const check = () => checkBackendHealth().then((ok) => setBackendAvailable(ok))
    check()
    const interval = setInterval(() => {
      if (!backendAvailable) check()
    }, 30_000)
    return () => clearInterval(interval)
  }, [backendAvailable, setBackendAvailable])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length])

  useEffect(() => {
    if (isLoading) {
      requestAnimationFrame(() => {
        const main = mainRef.current
        if (!main) return
        const nearBottom = main.scrollHeight - main.scrollTop - main.clientHeight < 260
        if (nearBottom) bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
      })
    }
  }, [isLoading])

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
  }, [inputValue])

  const stageHint = (stage: string) => {
    const labels: Record<string, string> = {
      dataset_uploaded: 'Dataset upload received',
      duckdb: 'Loading into DuckDB',
      yaml_engine: 'Understanding schema',
      yaml_generated: 'Semantic YAML generated',
      semantic_embedding: 'Building semantic query context',
      ready: 'Ready to query',
    }
    return labels[stage] ?? 'Processing dataset'
  }

  const handleFiles = useCallback(async (newFiles: File[]) => {
    if (!newFiles.length) return
    if (isLoading) {
      abortRef.current?.()
      abortRef.current = null
      setLoading(false)
      clearThinkingSteps()
    }

    setUploadError(null)
    setUploadStatus(null)
    setUploadProgress({ percent: 0, stage: 'dataset_uploaded', message: 'Preparing upload...' })
    setSuggestedQuestions([])

    const isFirstUpload = uploadedFiles.length === 0
    if (isFirstUpload) {
      if (sessionId) await clearSession(sessionId)
      resetForNewDataset()
    }

    const first = newFiles[0]
    setUploadedFile(first)
    const ext = first.name.split('.').pop()?.toLowerCase()
    const source: DataSource = ext === 'json' ? 'json' : ext === 'db' || ext === 'sqlite' || ext === 'sqlite3' ? 'database' : 'csv'
    setDataSource(source)

    const pendingBatch = newFiles.map((file) => ({
      file,
      tableName: `pending:${file.name}:${Date.now()}:${Math.random().toString(36).slice(2, 7)}`,
      rows: 0,
      columns: 0,
    }))

    setUploadedFiles((prev) => {
      const withoutDuplicates = prev.filter((item) => !newFiles.some((file) => item.file.name === file.name))
      return [...withoutDuplicates, ...pendingBatch]
    })

    uploadOpsRef.current += 1
    setUploading(true)
    try {
      const result = await uploadFilesWithProgress(newFiles, sessionId, setUploadProgress)
      if (!result.success) {
        setUploadError(result.message ?? 'Upload failed')
        setUploadedFiles((prev) => prev.filter((item) => item.rows > 0))
        setUploadProgress(null)
        return
      }

      const tables = result.tables && result.tables.length > 0
        ? result.tables
        : typeof result.rows === 'number' && typeof result.columns === 'number'
          ? [{ name: pendingBatch[0]?.tableName ?? `table_${Date.now()}`, filename: result.filename ?? first.name, rows: result.rows, columns: result.columns }]
          : []

      const profiled = tables.map((table) => {
        const sourceFile = newFiles.find((file) => file.name === table.filename) ?? newFiles[0]
        return { file: sourceFile, tableName: table.name, rows: table.rows, columns: table.columns }
      })

      setUploadedFiles((prev) => {
        const withoutUploaded = prev.filter((item) => !newFiles.some((file) => item.file.name === file.name))
        return profiled.length > 0 ? [...withoutUploaded, ...profiled] : [...withoutUploaded, ...pendingBatch]
      })
      if (tables[0]) setUploadInfo({ rows: tables[0].rows, columns: tables[0].columns })
      if (result.suggested_questions?.length) setSuggestedQuestions(result.suggested_questions)
      setUploadStatus(result.message ?? 'Data is ready.')
      setUploadProgress({ percent: 100, stage: 'ready', message: 'Data is ready.' })
      setTimeout(() => setUploadStatus(null), 4000)
    } catch {
      setUploadError('Upload failed. Is the backend running?')
      setUploadProgress(null)
      setUploadedFiles((prev) => prev.filter((item) => item.rows > 0))
    } finally {
      uploadOpsRef.current = Math.max(0, uploadOpsRef.current - 1)
      setUploading(uploadOpsRef.current > 0)
    }
  }, [
    clearThinkingSteps,
    isLoading,
    resetForNewDataset,
    sessionId,
    setDataSource,
    setLoading,
    setSuggestedQuestions,
    setUploadedFile,
    setUploadedFiles,
    setUploading,
    setUploadError,
    setUploadInfo,
    uploadedFiles.length,
  ])

  const handleQuery = useCallback((question: string, sourceFallback?: DataSource) => {
    if (isLoading || isUploading) return
    const hasUploadedData = useAppStore.getState().uploadedFiles.some((file) => file.rows > 0)
    if (!hasUploadedData) {
      addMessage({ id: generateId(), role: 'assistant', content: 'Upload at least one data file before asking questions.', timestamp: new Date() })
      return
    }

    const resolvedSource = sourceFallback ?? dataSource ?? 'csv'
    if (!dataSource) setDataSource(resolvedSource)
    clearThinkingSteps()

    const userMessageId = generateId()
    const assistantMessageId = generateId()
    addMessage({ id: userMessageId, role: 'user', content: question, timestamp: new Date() })
    setLoading(true)

    if (!backendAvailable) {
      setLoading(false)
      addMessage({ id: assistantMessageId, role: 'assistant', content: 'Backend is unavailable. Start the API server and try again.', timestamp: new Date() })
      return
    }

    const localSteps: ThinkingStep[] = []
    const abort = streamQuery(question, sessionId, resolvedSource ?? 'csv', {
      onThinkingStep: (step) => {
        localSteps.push(step)
        addThinkingStep(step)
      },
      onThinkingUpdate: (id, patch) => {
        const step = localSteps.find((item) => item.id === id)
        if (step) Object.assign(step, patch)
        updateThinkingStep(id, patch)
      },
      onResult: (result: QueryResult) => {
        setLoading(false)
        addMessage({
          id: assistantMessageId,
          role: 'assistant',
          content: result.answer,
          timestamp: new Date(),
          queryResult: result,
          thinkingSteps: localSteps.map((step) => ({ ...step, status: 'done' as const })),
        })
        clearThinkingSteps()
      },
      onError: (message) => {
        setLoading(false)
        addMessage({
          id: assistantMessageId,
          role: 'assistant',
          content: `Sorry, something went wrong: ${message}`,
          timestamp: new Date(),
          thinkingSteps: localSteps.map((step) => ({ ...step, status: 'done' as const })),
        })
        clearThinkingSteps()
      },
    })
    abortRef.current = abort
  }, [
    addMessage,
    addThinkingStep,
    backendAvailable,
    clearThinkingSteps,
    dataSource,
    isLoading,
    isUploading,
    sessionId,
    setDataSource,
    setLoading,
    updateThinkingStep,
  ])

  const handleSubmit = () => {
    const question = inputValue.trim()
    if (!question || !canSubmit) return
    handleQuery(question)
    setInputValue('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const removeFile = useCallback(async (tableName: string) => {
    const previous = useAppStore.getState().uploadedFiles
    const next = previous.filter((file) => file.tableName !== tableName)
    if (next.length === previous.length) return
    setUploadError(null)
    setUploadedFiles(next)
    if (next.length > 0) {
      setUploadedFile(next[0].file)
      setUploadInfo({ rows: next[0].rows, columns: next[0].columns })
    } else {
      setUploadedFile(null)
      setUploadInfo(null)
      setDataSource(null)
      setUploadProgress(null)
      setUploadStatus(null)
      setSuggestedQuestions([])
      clearChat()
      clearThinkingSteps()
    }

    const result = await removeUploadedTable(sessionId, tableName)
    if (!result.ok) {
      setUploadedFiles(previous)
      setUploadError('Could not remove the file from session.')
    }
  }, [clearChat, clearThinkingSteps, sessionId, setDataSource, setSuggestedQuestions, setUploadedFile, setUploadedFiles, setUploadError, setUploadInfo])

  return (
    <>
      <AnimatePresence>
        {isUploadOpen && <FileUpload onFilesSelected={handleFiles} onClose={() => setIsUploadOpen(false)} />}
      </AnimatePresence>
      <MobileHeader />
      <TopStatusBar fileName={contextFileName} />

      <main ref={mainRef} className="flex-1 overflow-y-auto overscroll-contain scroll-smooth p-md md:p-xl relative z-0 pb-[240px]">
        <div className="max-w-3xl mx-auto flex flex-col gap-lg items-center">
          <SessionMarker />
          {!isDashboardLike && <EmptyUtilityView activeView={activeView} onNavigate={onNavigate} />}
          <UploadProgressPanel
            files={uploadedFiles}
            isUploading={isUploading}
            hasPendingFiles={hasPendingFiles}
            uploadError={uploadError}
            uploadStatus={uploadStatus}
            uploadProgress={uploadProgress}
            stageHint={stageHint}
            onRemove={removeFile}
          />

          {messages.length === 0 && !isLoading && isDashboardLike && (
            <div className="w-full border-2 border-ink-black bg-surface-container p-lg text-center">
              <div className="font-label text-[12px] uppercase tracking-widest text-on-surface-variant mb-3">READY_FOR_QUERY</div>
              <h1 className="font-headline text-[32px] leading-tight font-semibold text-ink-black mb-2">Ask your data a question.</h1>
              <p className="font-body text-[16px] text-on-surface-variant">
                Upload a dataset, then execute a plain-English analytics request.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {isLoading && (
            <div className="w-full flex flex-col items-start gap-md">
              <div className="flex items-center gap-2 mb-1 w-full">
                <span className="font-label text-[12px] leading-none tracking-[0.05em] text-primary font-bold uppercase">Analytics Agent</span>
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              </div>
              <ThinkingDisplay steps={thinkingSteps} isThinking={isLoading} />
            </div>
          )}
          <div ref={bottomRef} />
          <div className="h-[120px] shrink-0" aria-hidden="true" />
        </div>
      </main>

      <CommandBar
        value={inputValue}
        canSubmit={canSubmit}
        disabled={isLoading || isUploading}
        placeholder="Ask a question about the data, e.g. 'Forecast next quarter'..."
        textareaRef={textareaRef}
        onChange={setInputValue}
        onSubmit={handleSubmit}
        onUploadClick={() => setIsUploadOpen(true)}
      />
    </>
  )
}

function SessionMarker() {
  return (
    <div className="flex justify-center my-sm w-full">
      <div className="border-2 border-ink-black bg-surface-container px-sm py-1 font-label text-[12px] leading-none tracking-[0.05em] uppercase inline-block rounded-DEFAULT text-on-surface-variant">
        Session Started: Today, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  )
}

interface UploadProgressPanelProps {
  files: ReturnType<typeof useAppStore.getState>['uploadedFiles']
  isUploading: boolean
  hasPendingFiles: boolean
  uploadError: string | null
  uploadStatus: string | null
  uploadProgress: UploadProgressEvent | null
  stageHint: (stage: string) => string
  onRemove: (tableName: string) => void
}

function UploadProgressPanel({
  files,
  isUploading,
  hasPendingFiles,
  uploadError,
  uploadStatus,
  uploadProgress,
  stageHint,
  onRemove,
}: UploadProgressPanelProps) {
  if (!isUploading && !uploadError && !uploadStatus && files.length === 0) return null

  return (
    <div className="w-full space-y-2">
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((file) => (
            <div key={file.tableName} className="flex items-center gap-2 px-sm py-1 border-2 border-ink-black bg-surface-container font-label text-[12px] rounded-DEFAULT">
              <Icon name="database" size={14} className="text-on-surface-variant" />
              <span className="text-ink-black truncate max-w-[200px]">{file.file.name}</span>
              {file.rows === 0 ? (
                <span className="text-on-surface-variant uppercase">{isUploading ? 'uploading' : 'selected'}</span>
              ) : (
                <span className="text-on-surface-variant">{file.rows.toLocaleString()} rows</span>
              )}
              {!isUploading && (
                <button className="p-0.5 hover:bg-surface-variant cursor-pointer" onClick={() => onRemove(file.tableName)}>
                  <Icon name="close" size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {hasPendingFiles && isUploading && !uploadError && (
        <div className="w-full border-2 border-ink-black bg-surface-container-low p-sm rounded-DEFAULT">
          <div className="flex items-center justify-between font-label text-[12px] mb-1.5">
            <span className="text-on-surface-variant uppercase">{uploadProgress?.message ?? 'Processing dataset...'}</span>
            <span className="text-on-surface-variant">{uploadProgress?.percent ?? 0}%</span>
          </div>
          <div className="h-2 w-full bg-surface-variant overflow-hidden border border-ink-black">
            <div className="h-full bg-primary-container transition-all duration-300" style={{ width: `${Math.max(0, Math.min(100, uploadProgress?.percent ?? 0))}%` }} />
          </div>
          <p className="font-label text-[10px] text-on-surface-variant mt-1.5 uppercase">{stageHint(uploadProgress?.stage ?? 'dataset_uploaded')}</p>
        </div>
      )}
      {uploadError && <p className="font-label text-[12px] text-error px-1 uppercase">{uploadError}</p>}
      {uploadStatus && !uploadError && !isUploading && <p className="font-label text-[12px] text-success px-1 uppercase">{uploadStatus}</p>}
    </div>
  )
}

function EmptyUtilityView({ activeView, onNavigate }: { activeView: AppView; onNavigate: (view: AppView) => void }) {
  return (
    <div className="w-full border-2 border-ink-black bg-surface-container p-lg">
      <div className="font-label text-[12px] uppercase tracking-widest text-on-surface-variant mb-2">{activeView}</div>
      <p className="font-body text-[16px] text-ink-black mb-4">This section is available through the main session workspace.</p>
      <button className="bg-primary-container text-white border-2 border-ink-black px-md py-sm font-label uppercase hard-shadow cursor-pointer" onClick={() => onNavigate('dashboard')}>
        Return To Current Session
      </button>
    </div>
  )
}
