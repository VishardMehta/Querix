import type { ReactNode } from 'react'
import { useAppStore } from '@/store/useAppStore'
import Icon from '@/components/ui/Icon'
import MobileHeader from '@/components/dashboard/MobileHeader'

interface DataWorkspaceProps {
  onUploadRequest: () => void
}

export default function DataWorkspace({ onUploadRequest }: DataWorkspaceProps) {
  const { uploadedFiles, uploadInfo } = useAppStore()
  const activeFile = uploadedFiles.find((file) => file.rows > 0) ?? uploadedFiles[0] ?? null

  return (
    <>
      <MobileHeader />
      <main className="flex-1 overflow-y-auto bg-surface-cream p-unit-2 md:p-unit-3 lg:p-unit-6 relative w-full flex justify-center">
        <div className="max-w-[1400px] w-full">
          <div className="hidden md:block mb-unit-6 border-b-2 border-ink-black pb-unit-2">
            <div>
              <div className="font-label text-[12px] text-secondary mb-2 uppercase">ACTIVE DATASET</div>
              <h2 className="display-lg text-ink-black break-words max-w-[1120px]">{activeFile?.file.name ?? 'No dataset loaded'}</h2>
            </div>
          </div>

          <div className="md:hidden mb-unit-4 mt-unit-2">
            <div className="font-label text-[12px] text-secondary mb-1 uppercase">ACTIVE DATASET</div>
            <h2 className="font-headline text-[24px] font-semibold text-ink-black">{activeFile?.file.name ?? 'No dataset loaded'}</h2>
          </div>

          {!activeFile ? (
            <section className="bg-white border-2 border-ink-black relative p-unit-6 md:p-unit-8 shadow-[6px_6px_0px_0px_#1C1B1B] min-h-[520px] flex items-center">
              <div className="absolute top-0 left-0 border-r-2 border-b-2 border-ink-black bg-white px-3 py-1 font-label text-[14px] uppercase tracking-widest font-bold">
                DATA_WORKSPACE
              </div>
              <div className="pt-8 w-full max-w-[620px]">
                <h1 className="font-headline text-[40px] md:text-[48px] leading-tight font-semibold text-ink-black mb-4">No uploaded dataset.</h1>
                <p className="font-body text-[18px] leading-relaxed text-on-surface-variant mb-8 max-w-[520px]">
                  Upload a data file from the Current Session command bar to populate this workspace with real table metadata.
                </p>
                <button
                  className="bg-electric-blue text-white border-2 border-ink-black px-6 py-3 font-label text-[12px] uppercase font-bold hard-shadow hard-shadow-hover hard-shadow-active cursor-pointer"
                  onClick={onUploadRequest}
                >
                  Go To Upload
                </button>
              </div>
            </section>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-unit-6">
              <div className="lg:col-span-4 space-y-unit-6">
                <WorkspaceCard title="SCHEMA DEFINITION">
                  <div className="space-y-3 mt-2">
                    <MetaRow icon="description" label="File Name" value={activeFile.file.name} />
                    <MetaRow icon="database" label="Table Name" value={activeFile.tableName} />
                    <MetaRow icon="tag" label="Rows" value={activeFile.rows.toLocaleString()} />
                    <MetaRow icon="view_column" label="Columns" value={activeFile.columns.toLocaleString()} />
                    <MetaRow icon="draft" label="Type" value={activeFile.file.name.split('.').pop()?.toUpperCase() || 'FILE'} />
                    {uploadInfo && <MetaRow icon="check_circle" label="Status" value="READY" />}
                  </div>
                </WorkspaceCard>

                <WorkspaceCard title="SEMANTIC LAYER">
                  <div className="space-y-4 mt-2">
                    <SemanticItem label="DATASET TABLE" value={activeFile.tableName} detail="Queryable in current session" />
                    <SemanticItem label="SOURCE FILE" value={activeFile.file.name} detail={`${activeFile.rows.toLocaleString()} rows loaded`} />
                    <SemanticItem label="PROFILE" value="Backend metadata" detail="Field-level preview appears when returned by API" />
                  </div>
                </WorkspaceCard>
              </div>

              <div className="lg:col-span-8">
                <WorkspaceCard title="RAW DATA PREVIEW" fill>
                  <div className="flex-1 p-4">
                    <div className="border-2 border-dashed border-ink-black bg-surface p-6 min-h-[360px]">
                      <div className="font-label text-[12px] uppercase tracking-widest text-secondary mb-4">REAL DATA ONLY</div>
                      <p className="font-body text-[16px] leading-relaxed text-ink-black max-w-2xl">
                        The current backend upload response exposes table name, rows, and column count, but not raw preview rows or column names.
                        This panel is intentionally not populated with mocked sales data.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                        <Metric label="Rows" value={activeFile.rows.toLocaleString()} />
                        <Metric label="Columns" value={activeFile.columns.toLocaleString()} />
                        <Metric label="Session" value="Active" />
                      </div>
                      <div className="mt-8 border-2 border-ink-black bg-surface-container p-4">
                        <div className="font-label text-[10px] uppercase tracking-widest text-secondary mb-3">NEXT BEST ACTION</div>
                        <p className="font-body text-[15px] leading-relaxed text-on-surface-variant">
                          Ask a profiling question in Current Session, such as “show column names and sample rows,” to generate a live preview from the backend.
                        </p>
                      </div>
                    </div>
                  </div>
                </WorkspaceCard>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}

function WorkspaceCard({ title, children, fill = false }: { title: string; children: ReactNode; fill?: boolean }) {
  return (
    <div className={['bg-white border-2 border-ink-black relative pt-10 pb-4 px-4 shadow-[6px_6px_0px_0px_#1C1B1B]', fill ? 'h-full flex flex-col' : ''].join(' ')}>
      <div className="absolute top-0 left-0 border-r-2 border-b-2 border-ink-black bg-white px-3 py-1 font-label text-[14px] uppercase tracking-widest font-bold">
        {title}
      </div>
      {children}
    </div>
  )
}

function MetaRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-dashed border-ink-black pb-2">
      <div className="flex items-center gap-2 min-w-0">
        <Icon name={icon} size={16} className="text-secondary shrink-0" />
        <span className="font-label text-[12px] text-ink-black font-bold truncate">{label}</span>
      </div>
      <span className="font-label text-[10px] text-electric-blue bg-blue-50 border border-electric-blue px-2 py-0.5 font-bold uppercase max-w-[160px] truncate">
        {value}
      </span>
    </div>
  )
}

function SemanticItem({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="bg-surface border border-ink-black p-3 hover:bg-surface-variant transition-colors">
      <div className="font-label text-[10px] text-secondary mb-1 uppercase font-bold">{label}</div>
      <div className="font-label text-[18px] leading-tight font-bold text-ink-black mb-2 break-all">{value}</div>
      <div className="font-label text-[12px] text-ink-black bg-surface-variant p-2 border border-dashed border-ink-black">{detail}</div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-2 border-ink-black bg-white p-4">
      <div className="font-label text-[10px] uppercase tracking-widest text-secondary mb-2">{label}</div>
      <div className="font-label text-[22px] font-bold text-ink-black">{value}</div>
    </div>
  )
}
