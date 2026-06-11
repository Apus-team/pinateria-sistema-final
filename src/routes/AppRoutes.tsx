import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '../components/ProtectedRoute'
import DashboardLayout from '../layouts/DashboardLayout'
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import Dashboard from '../pages/Dashboard'
import Productos from '../pages/Productos'
import Inventario from '../pages/Inventario'
import Clientes from '../pages/Clientes'
import Ventas from '../pages/Ventas'
import PedidosPersonalizados from '../pages/PedidosPersonalizados'
import Reportes from '../pages/Reportes'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="productos" element={<Productos />} />
        <Route path="inventario" element={<Inventario />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="ventas" element={<Ventas />} />
        <Route path="pedidos" element={<PedidosPersonalizados />} />
        <Route path="reportes" element={<Reportes />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
