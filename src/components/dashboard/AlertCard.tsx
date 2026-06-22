import { AlertTriangle, Info, CheckCircle } from 'lucide-react'

interface AlertCardProps {
  icon?: 'warning' | 'info' | 'success'
  message: string
  detail?: string
}

const iconMap = {
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
}

const colorMap = {
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
  success: 'border-green-200 bg-green-50 text-green-800',
}

const iconColorMap = {
  warning: 'text-amber-500',
  info: 'text-blue-500',
  success: 'text-green-500',
}

export default function AlertCard({ icon = 'info', message, detail }: AlertCardProps) {
  const Icon = iconMap[icon]

  return (
    <div className={`flex items-start gap-3 rounded-xl border p-4 ${colorMap[icon]}`}>
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconColorMap[icon]}`} />
      <div>
        <p className="text-sm font-medium">{message}</p>
        {detail && <p className="mt-0.5 text-xs opacity-80">{detail}</p>}
      </div>
    </div>
  )
}
