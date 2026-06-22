import { motion } from 'framer-motion'

interface DashboardChartCardProps {
  title: string
  children: React.ReactNode
  className?: string
  delay?: number
}

export default function DashboardChartCard({ title, children, className = '', delay = 0 }: DashboardChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ${className}`}
    >
      <h3 className="mb-4 text-base font-semibold text-gray-800">{title}</h3>
      {children}
    </motion.div>
  )
}
