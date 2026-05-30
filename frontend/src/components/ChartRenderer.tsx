import { useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Icon from '@/components/ui/Icon'
import type { ChartType } from '@/types'

interface ChartRendererProps {
  chartType: ChartType | 'donut'
  data: Record<string, unknown>[]
  xKey?: string
  yKey?: string
  nameKey?: string
  valueKey?: string
  title?: string
  columns?: string[]
  rows?: unknown[][]
}

const SERIES = ['#2563eb', '#ffb596', '#89ceff', '#b4c5ff', '#22c55e', '#ae3200', '#c9c6c5', '#ffffff', '#1d4ed8', '#7dd3fc', '#f97316', '#94a3b8']

const tooltipProps = {
  contentStyle: {
    background: 'var(--surface-container)',
    border: '2px solid var(--ink-black)',
    borderRadius: 0,
    color: 'var(--on-background)',
    fontFamily: 'var(--font-label)',
    fontSize: 12,
  },
  labelStyle: { color: 'var(--on-background)', fontWeight: 700 },
}

export default function ChartRenderer(props: ChartRendererProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null)
  const normalizedData = useMemo(() => normalizeRows(props.data, props.columns, props.rows), [props.data, props.columns, props.rows])
  const title = getTitle(props)
  const chartContent = renderChartContent({ ...props, data: normalizedData })

  if (!chartContent) return null

  const downloadChart = async () => {
    await downloadChartImage(chartRef.current, title)
    setMenuOpen(false)
  }

  return (
    <>
      <ChartFrame
        frameRef={chartRef}
        title={title}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((value) => !value)}
        onExpand={() => {
          setMenuOpen(false)
          setExpanded(true)
        }}
        onDownload={downloadChart}
      >
        {chartContent}
      </ChartFrame>

      {expanded && (
        <ExpandedChart title={title} onClose={() => setExpanded(false)}>
          {renderChartContent({ ...props, data: normalizedData, title }, 'expanded')}
        </ExpandedChart>
      )}
    </>
  )
}

function renderChartContent(
  {
    chartType,
    data,
    xKey,
    yKey,
    nameKey,
    valueKey,
    columns,
    rows,
  }: ChartRendererProps,
  mode: 'normal' | 'expanded' = 'normal',
) {
  if (chartType === 'table') {
    const tableColumns = columns?.length ? columns : data[0] ? Object.keys(data[0]) : []
    const tableRows = rows?.length ? rows : data.map((row) => tableColumns.map((column) => row[column]))
    return <DataTable columns={tableColumns} rows={tableRows} />
  }

  if (chartType === 'stat_card') {
    const first = data[0] ?? {}
    const label = xKey || Object.keys(first)[0] || 'Metric'
    const metricKey = inferKey(data, yKey || valueKey, 'number')
    const value = String(first[metricKey] ?? first[valueKey ?? ''] ?? Object.values(first)[0] ?? '0')
    return (
      <div className="bg-surface-container-low p-5">
        <div className="font-label text-[12px] uppercase tracking-widest text-on-surface-variant mb-4">{humanize(label)}</div>
        <div className="font-label text-[42px] leading-none font-bold text-ink-black">{formatValue(value)}</div>
      </div>
    )
  }

  if (!data.length) return null

  if (chartType === 'pie' || chartType === 'donut') {
    const labelKey = inferKey(data, nameKey || xKey, 'label')
    const metricKey = inferKey(data, valueKey || yKey, 'number')
    const pieData = data.slice(0, 12).map((row, index) => ({
      name: String(row[labelKey] ?? `Segment ${index + 1}`),
      value: Number(row[metricKey] ?? 0),
    })).filter((row) => Number.isFinite(row.value) && row.value !== 0)

    if (!pieData.length) return null

    const chartHeight = mode === 'expanded' ? 520 : 380
    const outerRadius = mode === 'expanded' ? 190 : 140
    const innerRadius = chartType === 'donut' ? (mode === 'expanded' ? 110 : 82) : 0

    return (
      <div className={[
        'grid grid-cols-1 gap-6 items-center',
        mode === 'expanded' ? 'xl:grid-cols-[minmax(420px,620px)_minmax(260px,1fr)]' : 'lg:grid-cols-[420px_1fr]',
      ].join(' ')}>
        <div className="min-h-[380px] bg-surface-container-low grid-bg p-4 overflow-hidden">
          <ResponsiveContainer width="100%" height={chartHeight}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={outerRadius}
                innerRadius={innerRadius}
                stroke="var(--surface-container-low)"
                strokeWidth={2}
                label={({ percent }) => {
                  const value = Math.round((percent ?? 0) * 100)
                  return value >= 3 ? `${value}%` : ''
                }}
                labelLine={false}
              >
                {pieData.map((_entry, index) => <Cell key={index} fill={SERIES[index % SERIES.length]} />)}
              </Pie>
              <Tooltip {...tooltipProps} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div>
          <div className="font-label text-[11px] uppercase tracking-widest text-on-surface-variant mb-4">
            {humanize(labelKey)} by {humanize(metricKey)}
          </div>
          <Legend items={pieData.map((item, index) => ({ label: item.name, color: SERIES[index % SERIES.length] }))} compact />
        </div>
      </div>
    )
  }

  const { chartRows, labelKey, seriesKeys } = normalizeChartData(data, xKey, yKey)
  if (!seriesKeys.length) return null

  const xLabel = humanize(xKey || labelKey)
  const yLabel = seriesKeys.length === 1 ? humanize(seriesKeys[0]) : 'Values'

  return (
    <>
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2 font-label text-[11px] uppercase tracking-widest text-on-surface-variant">
        <div>X Axis: <span className="text-ink-black">{xLabel}</span></div>
        <div>Y Axis: <span className="text-ink-black">{seriesKeys.map(humanize).join(', ')}</span></div>
      </div>
      <div className={[mode === 'expanded' ? 'h-[560px]' : 'h-[380px]', 'w-full p-3 grid-bg bg-surface-container-low'].join(' ')}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={chartRows} margin={{ top: 16, right: 28, left: 22, bottom: 44 }}>
              <CartesianGrid stroke="var(--outline-variant, var(--ink-black))" opacity={0.28} />
              <XAxis dataKey={labelKey} tick={axisTick()} stroke={axisColor()} interval="preserveStartEnd">
                <Label value={xLabel} position="insideBottom" offset={-32} fill={textColor()} fontSize={12} fontFamily="var(--font-label)" />
              </XAxis>
              <YAxis tick={axisTick()} stroke={axisColor()}>
                <Label value={yLabel} angle={-90} position="insideLeft" fill={textColor()} fontSize={12} fontFamily="var(--font-label)" />
              </YAxis>
              <Tooltip {...tooltipProps} />
              {seriesKeys.map((key, index) => (
                <Line key={key} type="monotone" dataKey={key} stroke={SERIES[index % SERIES.length]} strokeWidth={3} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 5 }} />
              ))}
            </LineChart>
          ) : (
            <BarChart data={chartRows} margin={{ top: 16, right: 28, left: 22, bottom: 44 }}>
              <CartesianGrid stroke="var(--outline-variant, var(--ink-black))" opacity={0.28} />
              <XAxis dataKey={labelKey} tick={axisTick()} stroke={axisColor()} interval="preserveStartEnd">
                <Label value={xLabel} position="insideBottom" offset={-32} fill={textColor()} fontSize={12} fontFamily="var(--font-label)" />
              </XAxis>
              <YAxis tick={axisTick()} stroke={axisColor()}>
                <Label value={yLabel} angle={-90} position="insideLeft" fill={textColor()} fontSize={12} fontFamily="var(--font-label)" />
              </YAxis>
              <Tooltip {...tooltipProps} />
              {seriesKeys.map((key, index) => (
                <Bar key={key} dataKey={key} fill={SERIES[index % SERIES.length]} stroke="none" />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
      <Legend items={seriesKeys.map((key, index) => ({ label: humanize(key), color: SERIES[index % SERIES.length] }))} />
    </>
  )
}

function ChartFrame({
  frameRef,
  title,
  children,
  menuOpen,
  onToggleMenu,
  onExpand,
  onDownload,
}: {
  frameRef: RefObject<HTMLDivElement | null>
  title: string
  children: ReactNode
  menuOpen: boolean
  onToggleMenu: () => void
  onExpand: () => void
  onDownload: () => void
}) {
  return (
    <div ref={frameRef} className="w-full border-2 border-ink-black bg-surface-container relative mt-sm rounded-DEFAULT overflow-visible">
      <div className="absolute -top-[2px] -left-[2px] border-2 border-ink-black bg-primary-container px-3 py-1 z-10 rounded-tl-DEFAULT rounded-br-DEFAULT max-w-[calc(100%-80px)] min-w-[220px]">
        <span className="font-label text-[12px] tracking-widest font-bold uppercase text-white block truncate" title={title}>
          VISUALIZATION : {title.toUpperCase()}
        </span>
      </div>
      <div className="absolute top-2 right-2 z-20">
        <button
          className="p-1.5 border-2 border-ink-black bg-surface-bright hover:bg-surface-variant rounded-DEFAULT text-on-background cursor-pointer"
          title="Chart options"
          onClick={onToggleMenu}
        >
          <Icon name="more_vert" size={20} />
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-44 bg-surface-bright border-2 border-ink-black font-label text-[12px] uppercase shadow-[4px_4px_0_0_var(--ink-black)]">
            <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-variant text-left cursor-pointer" onClick={onExpand}>
              <Icon name="open_in_full" size={16} /> Enlarge
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-variant text-left border-t border-ink-black cursor-pointer" onClick={onDownload}>
              <Icon name="download" size={16} /> Download Image
            </button>
          </div>
        )}
      </div>
      <div className="p-lg pt-16 pb-8">{children}</div>
    </div>
  )
}

function ExpandedChart({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/[0.82] p-4 md:p-8 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="bg-surface border-2 border-ink-black w-[min(1180px,calc(100vw-48px))] max-h-[86vh] overflow-auto shadow-[8px_8px_0_0_var(--ink-black)]">
        <div className="sticky top-0 z-10 bg-surface-container border-b-2 border-ink-black p-4 flex items-center justify-between gap-4">
          <h2 className="font-label text-[13px] uppercase tracking-widest text-ink-black truncate">{title}</h2>
          <button className="border-2 border-ink-black bg-surface-bright p-2 hover:bg-surface-variant cursor-pointer" onClick={onClose} title="Close expanded chart">
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

function DataTable({ columns, rows }: { columns: string[]; rows: unknown[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left border-collapse font-label text-[12px]">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} className="bg-surface-variant border-b-2 border-ink-black p-3 uppercase tracking-wider text-ink-black">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowIndex % 2 === 1 ? 'bg-surface' : ''}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="border-b border-dashed border-ink-black p-3 text-ink-black">
                  {String(cell ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Legend({ items, compact = false }: { items: Array<{ label: string; color: string }>; compact?: boolean }) {
  if (!items.length) return null
  return (
    <div className={[
      compact ? 'p-4 bg-surface-bright' : 'border-t-2 border-ink-black mt-6 -mx-lg -mb-8 p-4 bg-surface-bright',
      'flex items-center justify-center gap-5 flex-wrap font-label text-[12px] text-ink-black rounded-b-DEFAULT',
    ].join(' ')}>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-ink-black rounded-sm" style={{ backgroundColor: item.color }} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

function normalizeRows(data: Record<string, unknown>[], columns?: string[], rows?: unknown[][]) {
  if (!rows?.length || !columns?.length) return data
  return rows.map((row) => Object.fromEntries(columns.map((column, index) => [column, row[index]])))
}

function normalizeChartData(rawData: Record<string, unknown>[], xKey?: string, yKey?: string) {
  const rawLabelKey = inferKey(rawData, xKey, 'label')
  const valueKey = inferKey(rawData, yKey, 'number')
  const numericKeys = rawData[0]
    ? Object.keys(rawData[0]).filter((key) => key !== rawLabelKey && Number.isFinite(Number(rawData[0][key])))
    : []
  const seriesKeys = numericKeys.length > 0 ? numericKeys : valueKey ? [valueKey] : []
  const chartRows = rawData.slice(0, 40).map((row, index) => ({
    ...row,
    __label: String(row[rawLabelKey] ?? row[xKey ?? ''] ?? `Row ${index + 1}`),
    ...Object.fromEntries(seriesKeys.map((key) => [key, Number(row[key] ?? 0)])),
  }))
  return { chartRows, labelKey: '__label', seriesKeys }
}

function inferKey(data: Record<string, unknown>[], preferred?: string, kind: 'label' | 'number' = 'label') {
  if (preferred && data.some((row) => row[preferred] !== undefined)) return preferred
  const first = data[0] ?? {}
  const keys = Object.keys(first)
  if (kind === 'number') return keys.find((key) => Number.isFinite(Number(first[key]))) ?? keys[1] ?? keys[0] ?? ''
  return keys.find((key) => !Number.isFinite(Number(first[key]))) ?? keys[0] ?? ''
}

function getTitle({ chartType }: ChartRendererProps) {
  if (chartType === 'table') return 'DATA TABLE'
  if (chartType === 'stat_card') return 'METRIC'
  if (chartType === 'histogram') return 'HISTOGRAM'
  if (chartType === 'donut') return 'DONUT CHART'
  return `${String(chartType || 'chart').toUpperCase()} CHART`
}

function humanize(value?: string) {
  return (value || 'value').replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

async function downloadChartImage(container: HTMLDivElement | null, title: string) {
  if (!container) return
  const svg = container.querySelector('.recharts-wrapper svg') as SVGSVGElement | null
  if (!svg) return

  const rect = svg.getBoundingClientRect()
  const width = Math.max(1, Math.round(rect.width || Number(svg.getAttribute('width')) || 1000))
  const height = Math.max(1, Math.round(rect.height || Number(svg.getAttribute('height')) || 600))
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', String(width))
  clone.setAttribute('height', String(height))

  const resolvedTextColor = getComputedStyle(container).getPropertyValue('--on-background').trim() || '#1b1c19'
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style')
  style.textContent = `
    text { font-family: "Space Mono", monospace; }
    .recharts-cartesian-axis-tick-value, .recharts-label { fill: ${resolvedTextColor}; }
  `
  clone.insertBefore(style, clone.firstChild)

  const svgBlob = new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)
  try {
    const image = await loadImage(url)
    const canvas = document.createElement('canvas')
    const scale = 2
    canvas.width = width * scale
    canvas.height = height * scale
    const context = canvas.getContext('2d')
    if (!context) return
    const background = getComputedStyle(container).getPropertyValue('--surface-container-low').trim() || '#f5f3ee'
    context.scale(scale, scale)
    context.fillStyle = background
    context.fillRect(0, 0, width, height)
    context.drawImage(image, 0, 0, width, height)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (blob) downloadBlob(blob, `${slugify(title) || 'chart'}.png`)
  } finally {
    URL.revokeObjectURL(url)
  }
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function formatValue(value: string) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue.toLocaleString() : value
}

function axisTick() {
  return { fill: textColor(), fontFamily: 'var(--font-label)', fontSize: 11 }
}

function textColor() {
  return 'var(--on-background)'
}

function axisColor() {
  return 'var(--on-surface-variant)'
}
