import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  message?: string
  action?: React.ReactNode
}

export default function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-50">
        {icon || <Inbox className="h-7 w-7 text-gray-300" />}
      </div>
      <h3 className="text-base font-semibold text-gray-700">{title}</h3>
      {message && <p className="mt-1 text-sm text-gray-400">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
