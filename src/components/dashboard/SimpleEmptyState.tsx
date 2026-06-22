import { Inbox } from 'lucide-react'

interface SimpleEmptyStateProps {
  message?: string
}

export default function SimpleEmptyState({ message = 'Sin datos disponibles' }: SimpleEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Inbox className="mb-2 h-10 w-10 text-gray-300 dark:text-gray-600" />
      <p className="text-sm text-gray-400 dark:text-gray-500">{message}</p>
    </div>
  )
}
