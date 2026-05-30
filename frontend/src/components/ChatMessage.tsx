import type { Message } from '@/store/useAppStore'
import AnswerCard from '@/components/AnswerCard'
import ThinkingDisplay from '@/components/ThinkingDisplay'
import { motion } from 'framer-motion'

interface ChatMessageProps {
  message: Message
}

export default function ChatMessage({ message }: ChatMessageProps) {
  if (message.role === 'user') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="flex flex-col items-end w-full mb-md"
      >
        <div className="flex items-center gap-2 mb-2 w-full justify-end">
          <span className="font-label text-[12px] leading-none tracking-[0.05em] text-on-surface-variant uppercase">User / Query</span>
        </div>
        <div className="bg-surface-bright border-2 border-ink-black p-md max-w-[85%] md:max-w-[80%] font-body text-[16px] text-ink-black leading-relaxed hard-shadow rounded-DEFAULT">
          {message.content}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex flex-col items-start w-full gap-md"
    >
      <div className="flex items-center gap-2 mb-1 w-full">
        <span className="font-label text-[12px] leading-none tracking-[0.05em] text-primary font-bold uppercase">Analytics Agent</span>
        <span className="w-2 h-2 bg-primary rounded-full" />
      </div>
      {message.thinkingSteps && message.thinkingSteps.length > 0 && (
        <ThinkingDisplay steps={message.thinkingSteps} isThinking={false} />
      )}
      {message.queryResult ? (
        <AnswerCard result={message.queryResult} />
      ) : (
        <div className="w-full font-body text-[16px] text-ink-black leading-[1.8] space-y-4">
          <p>{message.content}</p>
        </div>
      )}
    </motion.div>
  )
}
