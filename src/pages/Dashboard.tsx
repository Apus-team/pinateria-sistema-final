import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { DashboardResumen } from '../types/database'
import { ShoppingCart, Package, AlertTriangle, ClipboardList, Users } from 'lucide-react'

const cards = [
  { key: 'ventas_dia', label: 'Ventas del día', icon: ShoppingCart, color: 'bg-fucsia-500' },
  { key: 'productos_registrados', label: 'Productos registrados', icon: Package, color: 'bg-morado-500' },
  { key: 'productos_bajo_stock', label: 'Productos bajo stock', icon: AlertTriangle, color: 'bg-amber-500' },
  { key: 'pedidos_pendientes', label: 'Pedidos pendientes', icon: ClipboardList, color: 'bg-blue-500' },
  { key: 'clientes_registrados', label: 'Clientes registrados', icon: Users, color: 'bg-green-500' },
]

export default function Dashboard() {
  const [data, setData] = useState<DashboardResumen | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data: res, error: err } = await supabase.from('vw_dashboard_resumen').select('*').single()

      if (err) {
        setError(err.message)
      } else {
        setData(res)
      }
      setLoading(false)
    }

    fetchData()
  }, [])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Resumen general del estado de tu piñatería
        </p>
      </div>

      {loading && (
        <p className="text-sm text-gray-400">Cargando resumen...</p>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          No se pudo cargar el resumen: {error}
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {cards.map((card) => {
            const value = data[card.key as keyof DashboardResumen] ?? 0
            const Icon = card.icon

            return (
              <div
                key={card.key}
                className="rounded-xl bg-white p-5 shadow-sm border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{card.label}</p>
                    <p className="mt-1 text-3xl font-bold text-gray-800">
                      {typeof value === 'number' ? value : '-'}
                    </p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${card.color} bg-opacity-10`}>
                    <Icon className={`h-6 w-6 ${card.color.replace('bg-', 'text-')}`} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!data && !loading && !error && (
        <p className="text-sm text-gray-400">No hay datos disponibles.</p>
      )}
    </div>
  )
}
