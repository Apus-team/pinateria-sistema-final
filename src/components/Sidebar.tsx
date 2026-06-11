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
    <aside className="flex h-full w-64 flex-col bg-white shadow-lg">
      <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-fucsia-500 to-morado-600 text-white text-sm font-bold">
          P
        </div>
        <span className="text-lg font-semibold text-gray-800">Piñatería</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-fucsia-50 text-fucsia-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
