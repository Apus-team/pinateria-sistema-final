import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

const colorMap: Record<string, string> = {
  fucsia: 'border-fucsia-100',
  green: 'border-green-100',
  red: 'border-red-100',
  blue: 'border-blue-100',
  amber: 'border-amber-100',
  emerald: 'border-emerald-100',
  purple: 'border-purple-100',
}

const iconBgMap: Record<string, string> = {
  fucsia: 'bg-fucsia-50 text-fuccia-600',
  green: 'bg-green-50 text-green-600',
  red: 'bg-red-50 text-red-600',
  blue: 'bg-blue-50 text-blue-600',
  amber: 'bg-amber-50 text-amber-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  purple: 'bg-purple-50 text-purple-600',
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
      className={`rounded-2xl border ${borderClass} bg-white p-5 shadow-sm`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  )
}
