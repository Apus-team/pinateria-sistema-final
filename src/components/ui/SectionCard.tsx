import { motion } from 'framer-motion'

interface SectionCardProps {
  title?: string
  subtitle?: string
  children: React.ReactNode
  className?: string
  delay?: number
  action?: React.ReactNode
}

export default function SectionCard({ title, subtitle, children, className = '', delay = 0, action }: SectionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={`rounded-2xl border border-gray-100 bg-white shadow-sm ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            {title && <h3 className="text-base font-semibold text-gray-800">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </motion.div>
  )
}
