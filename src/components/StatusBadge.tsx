import { AlertTriangle, XCircle } from 'lucide-react'

interface StatusBadgeProps {
  stockActual: number
  stockMinimo: number
  estado?: string | null
}

export default function StatusBadge({ stockActual, stockMinimo, estado }: StatusBadgeProps) {
  if (stockActual === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
        <XCircle className="h-3 w-3" />
        Agotado
      </span>
    )
  }

  if (stockActual <= stockMinimo) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
        <AlertTriangle className="h-3 w-3" />
        Bajo stock
      </span>
    )
  }

  if (estado) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300">
        Disponible
      </span>
    )
  }

  return null
}
