import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

const colorMap: Record<string, string> = {
  fucsia: 'border-fucsia-100 dark:border-fucsia-900/40',
  green: 'border-green-100 dark:border-green-900/40',
  red: 'border-red-100 dark:border-red-900/40',
  blue: 'border-blue-100 dark:border-blue-900/40',
  amber: 'border-amber-100 dark:border-amber-900/40',
  emerald: 'border-emerald-100 dark:border-emerald-900/40',
  purple: 'border-purple-100 dark:border-purple-900/40',
}

const iconBgMap: Record<string, string> = {
  fucsia: 'bg-fucsia-50 text-fucsia-600 dark:bg-fucsia-900/30 dark:text-fucsia-300',
  green: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-300',
  red: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300',
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300',
  purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300',
}

interface MetricCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  subtitle?: string
  color?: string
  delay?: number
}

export default function MetricCard({ icon: Icon, label, value, subtitle, color = 'fucsia', delay = 0 }: MetricCardProps) {
  const borderClass = colorMap[color] || 'border-gray-100'
  const iconClass = iconBgMap[color] || 'bg-gray-50 text-gray-400'

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className={`rounded-2xl border ${borderClass} bg-white p-5 shadow-sm dark:bg-gray-900`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  )
}
