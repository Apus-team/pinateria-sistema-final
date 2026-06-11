import { Warehouse } from 'lucide-react'

export default function Inventario() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Inventario</h1>
        <p className="mt-1 text-sm text-gray-500">
          Control de existencias y movimientos de inventario
        </p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white py-20">
        <Warehouse className="mb-4 h-12 w-12 text-gray-300" />
        <p className="text-lg font-medium text-gray-600">
          Módulo de Inventario
        </p>
        <p className="mt-1 text-sm text-gray-400">
          Módulo preparado para desarrollo en la siguiente feature
        </p>
      </div>
    </div>
  )
}
