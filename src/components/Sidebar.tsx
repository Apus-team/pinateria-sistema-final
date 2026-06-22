import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Warehouse,
  Users,
  ShoppingCart,
  ClipboardList,
  BarChart3,
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/productos', icon: Package, label: 'Productos' },
  { to: '/inventario', icon: Warehouse, label: 'Inventario' },
  { to: '/clientes', icon: Users, label: 'Clientes' },
  { to: '/ventas', icon: ShoppingCart, label: 'Ventas' },
  { to: '/pedidos', icon: ClipboardList, label: 'Pedidos' },
  { to: '/reportes', icon: BarChart3, label: 'Reportes' },
]

export default function Sidebar() {
  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-3 border-b border-gray-50 px-5 py-5 dark:border-gray-800">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-fucsia-500 to-morado-600 text-base font-bold text-white shadow-sm shadow-fucsia-200">
          P
        </div>
        <div>
          <span className="text-base font-semibold text-gray-800 dark:text-gray-100">Piñatería</span>
          <p className="text-xs text-gray-400 dark:text-gray-500">Sistema de gestión</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-fucsia-50 to-morado-50 text-fucsia-700 shadow-sm dark:from-fucsia-900/30 dark:to-morado-900/30 dark:text-fucsia-300'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
              }`
            }
          >
            <item.icon className={`h-5 w-5 transition-transform`} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-50 px-5 py-4 dark:border-gray-800">
        <p className="text-center text-xs text-gray-300 dark:text-gray-600">v1.0.0</p>
      </div>
    </aside>
  )
}
