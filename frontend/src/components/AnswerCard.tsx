import { useState } from 'react'
import type { QueryResult } from '@/types'
import ChartRenderer from '@/components/ChartRenderer'
import Icon from '@/components/ui/Icon'
import { parseBold } from '@/utils/formatAnswer'

interface AnswerCardProps {
  result: QueryResult
}

function RichText({ text }: { text: string }) {
  const chunks = parseBold(text)
  return (
    <>
      {chunks.map((chunk, index) => (
        chunk.bold ? (
          <strong key={index} className="text-ink-black font-semibold">{chunk.text}</strong>
        ) : (
          <span key={index}>{chunk.text}</span>
        )
      ))}
    </>
  )
}

export default function AnswerCard({ result }: AnswerCardProps) {
  const record = result as QueryResult & Record<string, unknown>
  const debugTimings = record.debug_timings as Record<string, unknown> | undefined
  const [sqlOpen, setSqlOpen] = useState(false)
  const chartType = result.chart_type
  const hasChart = Boolean(chartType && result.data && result.data.length > 0)
  const hasTable = chartType === 'table' && ((result.columns?.length ?? 0) > 0 || (result.data?.length ?? 0) > 0)
  const confidence =
    result.confidence ??
    record.confidence_score ??
    record.confidence_level ??
    record.confidence_pct
  const hasTechnicalDetails = true
  const paragraphs = formatParagraphs(result.answer)

  return (
    <div className="w-full space-y-4">
      <div className="w-full font-body text-[16px] text-ink-black leading-[1.8] space-y-4">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>
            <RichText text={paragraph} />
          </p>
        ))}
      </div>

      {hasChart && (
        <ChartRenderer
          chartType={chartType!}
          data={result.data ?? []}
          xKey={result.x_key}
          yKey={result.y_key}
          nameKey={result.name_key}
          valueKey={result.value_key}
          columns={result.columns}
          rows={result.rows}
          title={hasTable ? 'Data Table' : result.interpreted_as || result.question}
        />
      )}

      {hasTechnicalDetails && (
        <div>
          <button
            className="flex items-center gap-2 font-label text-[12px] text-ink-black bg-surface-bright border-2 border-ink-black px-3 py-2 uppercase cursor-pointer hover:bg-surface-variant"
            onClick={() => setSqlOpen((value) => !value)}
          >
            <Icon name="code" size={14} />
            Technical Details
            <Icon name={sqlOpen ? 'expand_less' : 'expand_more'} size={14} />
          </button>
          {sqlOpen && (
            <div className="font-label text-[13px] bg-surface-container-lowest text-primary p-4 overflow-auto leading-relaxed border-2 border-ink-black mt-2 space-y-4 max-h-[360px]">
              {result.sql && (
                <pre className="whitespace-pre-wrap">{result.sql}</pre>
              )}
              {debugTimings && (
                <div className="text-on-surface-variant">
                  <div className="uppercase text-ink-black mb-2">Timing Breakdown</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(debugTimings).map(([key, value]) => (
                      <div key={key} className="flex justify-between border border-ink-black px-2 py-1">
                        <span>{key}</span>
                        <span>{String(value)}ms</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {!result.sql && !debugTimings && (
                <div className="text-on-surface-variant">
                  No SQL or timing details were returned for this answer. This can happen when the backend answers from a cached, metadata, or non-SQL path.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap font-label text-[12px] leading-none tracking-[0.05em] text-on-surface-variant">
        {result.table_name && (
          <span className="uppercase">
            Source:{' '}
            <code className="bg-surface-variant border border-ink-black px-1.5 py-0.5 font-label text-[13px] rounded-sm text-primary">
              {result.table_name}
            </code>
          </span>
        )}
        {result.cached && <span className="border-2 border-ink-black bg-surface-bright px-2 py-1 uppercase text-accent-orange">Cached</span>}
        {result.time_ms !== undefined && <span>{Math.round(result.time_ms)}ms</span>}
        <span className="border-2 border-ink-black bg-surface-bright px-2 py-1 uppercase text-ink-black">
          Confidence: {confidence === undefined || confidence === null
            ? 'N/A'
            : typeof confidence === 'number' && confidence <= 10
              ? `${confidence}/10`
              : String(confidence)}
        </span>
      </div>
    </div>
  )
}

function formatParagraphs(answer: string) {
  const explicit = answer.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean)
  if (explicit.length > 1) return explicit
  const single = explicit[0] ?? answer.trim()
  if (single.length < 480) return single ? [single] : []

  const sentences = single.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g)?.map((part) => part.trim()).filter(Boolean) ?? [single]
  const paragraphs: string[] = []
  let current: string[] = []
  let currentLength = 0

  sentences.forEach((sentence) => {
    current.push(sentence)
    currentLength += sentence.length
    if (current.length >= 2 || currentLength > 360) {
      paragraphs.push(current.join(' '))
      current = []
      currentLength = 0
    }
  })

  if (current.length) paragraphs.push(current.join(' '))
  return paragraphs
}
