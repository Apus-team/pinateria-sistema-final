import { ShoppingCart } from 'lucide-react'

export default function Ventas() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Ventas</h1>
        <p className="mt-1 text-sm text-gray-500">
          Registro de ventas y detalle de transacciones
        </p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white py-20">
        <ShoppingCart className="mb-4 h-12 w-12 text-gray-300" />
        <p className="text-lg font-medium text-gray-600">
          Módulo de Ventas
        </p>
        <p className="mt-1 text-sm text-gray-400">
          Módulo preparado para desarrollo en la siguiente feature
        </p>
      </div>
    </div>
  )
}
