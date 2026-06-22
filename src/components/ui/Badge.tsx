const badgeStyles: Record<string, string> = {
  disponible: 'bg-green-100 text-green-700',
  agotado: 'bg-red-100 text-red-700',
  bajo_stock: 'bg-amber-100 text-amber-700',
  descontinuado: 'bg-gray-200 text-gray-600',
  activo: 'bg-green-100 text-green-700',
  inactivo: 'bg-gray-100 text-gray-500',
  completada: 'bg-green-100 text-green-700',
  anulada: 'bg-red-100 text-red-700',
  pendiente: 'bg-amber-100 text-amber-700',
  en_proceso: 'bg-blue-100 text-blue-700',
  listo: 'bg-morado-100 text-morado-700',
  entregado: 'bg-green-100 text-green-700',
  cancelado: 'bg-gray-200 text-gray-600',
}

const badgeLabels: Record<string, string> = {
  disponible: 'Disponible',
  agotado: 'Agotado',
  bajo_stock: 'Bajo stock',
  descontinuado: 'Descontinuado',
  activo: 'Activo',
  inactivo: 'Inactivo',
  completada: 'Completada',
  anulada: 'Anulada',
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  listo: 'Listo',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

interface BadgeProps {
  status: string | null
  label?: string
  className?: string
}

export default function Badge({ status, label, className = '' }: BadgeProps) {
  const key = status ?? ''
  const style = badgeStyles[key] || 'bg-gray-100 text-gray-600'
  const text = label || badgeLabels[key] || key || '—'

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style} ${className}`}>
      {text}
    </span>
  )
}
