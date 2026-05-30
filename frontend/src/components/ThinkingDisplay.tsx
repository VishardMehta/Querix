import { AnimatePresence, motion } from 'framer-motion'
import Icon from '@/components/ui/Icon'
import type { ThinkingStep } from '@/types'

interface ThinkingDisplayProps {
  steps: ThinkingStep[]
  isThinking: boolean
}

const defaultLiveSteps: ThinkingStep[] = [
  {
    id: 'live-routing',
    type: 'routing',
    message: 'Classifying your question',
    status: 'active',
    timestamp: Date.now(),
  },
  {
    id: 'live-sql',
    type: 'sql',
    message: 'Generating SQL query',
    status: 'pending',
    timestamp: Date.now(),
  },
  {
    id: 'live-execute',
    type: 'executing',
    message: 'Running the query',
    status: 'pending',
    timestamp: Date.now(),
  },
  {
    id: 'live-answer',
    type: 'answering',
    message: 'Generating answer',
    status: 'pending',
    timestamp: Date.now(),
  },
]

export default function ThinkingDisplay({ steps, isThinking }: ThinkingDisplayProps) {
  const visibleSteps = steps.length > 0 ? withLiveProgress(steps, isThinking) : isThinking ? defaultLiveSteps : []
  if (visibleSteps.length === 0) return null

  return (
    <div className="w-full border-2 border-ink-black bg-surface-container relative pt-8 p-md mb-sm rounded-DEFAULT">
      <div className="absolute -top-[2px] -left-[2px] border-2 border-ink-black bg-surface-bright px-3 py-1 rounded-tl-DEFAULT rounded-br-DEFAULT">
        <span className="font-label text-[10px] tracking-widest font-bold uppercase text-ink-black">AGENT_LOG</span>
      </div>
      <div className="flex flex-col gap-4 font-label text-[12px] leading-none tracking-[0.05em] text-on-surface-variant">
        <AnimatePresence initial={false}>
          {visibleSteps.map((step, index) => (
            <StepRow key={step.id} step={step} index={index} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

function withLiveProgress(steps: ThinkingStep[], isThinking: boolean) {
  if (!isThinking) return steps
  const hasActive = steps.some((step) => step.status === 'active' || step.status === 'error')
  if (hasActive) return steps
  const lastDone = steps[steps.length - 1]
  if (!lastDone) return steps
  return [
    ...steps,
    {
      id: `waiting-${lastDone.id}`,
      type: 'answering',
      message: 'Waiting for next processing stage',
      status: 'active',
      timestamp: Date.now(),
    } as ThinkingStep,
  ]
}

function StepRow({ step, index }: { step: ThinkingStep; index: number }) {
  const isDone = step.status === 'done'
  const isActive = step.status === 'active'
  const isPending = step.status === 'pending'
  const isError = step.status === 'error'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18, delay: Math.min(index * 0.04, 0.2) }}
      className={[
        'relative flex items-center gap-3 min-w-0 pb-1',
        isPending ? 'text-on-surface-variant opacity-60' : '',
        isError ? 'text-error' : '',
      ].join(' ')}
    >
      {isDone && <Icon name="check_circle" size={16} className="text-primary" />}
      {isActive && <Icon name="sync" size={16} className="text-primary animate-spin-slow" />}
      {isPending && <Icon name="radio_button_unchecked" size={16} />}
      {isError && <Icon name="error" size={16} className="text-error" />}
      <span className={['truncate', isActive ? 'font-bold text-ink-black' : ''].join(' ')}>
        {step.message}
      </span>
      <span className="ml-auto text-[11px] shrink-0">
        {isDone && <span className="text-on-surface-variant">{step.detail || 'done'}</span>}
        {isActive && <span className="text-primary">in progress</span>}
      </span>
      {isActive && (
        <motion.span
          className="absolute left-0 right-0 bottom-0 h-[2px] bg-primary-container"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.2, repeat: Infinity, repeatType: 'reverse' }}
          style={{ transformOrigin: 'left' }}
        />
      )}
    </motion.div>
  )
}
