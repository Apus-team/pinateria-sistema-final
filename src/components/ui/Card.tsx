import { motion } from 'framer-motion'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  delay?: number
}

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

export default function Card({
  children,
  className = '',
  padding = 'md',
  hover = false,
  delay = 0,
}: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={`rounded-2xl border border-gray-100 bg-white shadow-sm ${paddings[padding]} ${hover ? 'transition-shadow hover:shadow-md' : ''} ${className}`}
    >
      {children}
    </motion.div>
  )
}
