import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import type {
  DashboardResumen,
  HistorialVentaView,
  InventarioView,
  PedidoPersonalizadoView,
} from '../types/database'
import {
  ShoppingCart,
  Package,
  AlertTriangle,
  ClipboardList,
  Users,
  DollarSign,
  RefreshCw,
  Calendar,
  TrendingUp,
  Star,
} from 'lucide-react'
import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import KpiCard from '../components/dashboard/KpiCard'
import DashboardChartCard from '../components/dashboard/DashboardChartCard'
import SimpleEmptyState from '../components/dashboard/SimpleEmptyState'
import AlertCard from '../components/dashboard/AlertCard'

function formatCurrency(value: unknown): string {
  const numberValue = Number(value || 0)
  return `S/ ${numberValue.toFixed(2)}`
}

function formatNumber(value: unknown): string {
  return String(Number(value || 0))
}

const today = new Date()
const todayStr = today.toLocaleDateString('es-PE', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

const PAYMENT_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  yape: 'Yape',
  plin: 'Plin',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  otro: 'Otro',
}

const ORDER_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  listo: 'Listo',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

const ORDER_COLORS: Record<string, string> = {
  pendiente: '#f59e0b',
  en_proceso: '#3b82f6',
  listo: '#22c55e',
  entregado: '#a855f7',
  cancelado: '#ef4444',
}

const INVENTORY_COLORS: Record<string, string> = {
  disponible: '#22c55e',
  bajo_stock: '#f59e0b',
  agotado: '#ef4444',
}

const INVENTORY_LABELS: Record<string, string> = {
  disponible: 'Disponible',
  bajo_stock: 'Bajo stock',
  agotado: 'Agotado',
}

interface SalesByDay {
  fecha: string
  total: number
}

interface PaymentMethodData {
  name: string
  cantidad: number
  total: number
}

interface InventoryStatus {
  name: string
  value: number
  color: string
}

interface OrderStatus {
  name: string
  cantidad: number
}

interface TopProduct {
  nombre: string
  cantidad_vendida: number
  ingreso_generado: number
}

interface FrequentClient {
  nombre: string
  cantidad_compras: number
  total_compras: number
}

interface Alert {
  type: 'warning' | 'info' | 'success'
  message: string
  detail?: string
}

function processSalesByDay(data: HistorialVentaView[]): SalesByDay[] {
  const safe = data ?? []
  const last7 = new Date()
  last7.setDate(last7.getDate() - 7)

  const filtered = safe.filter((v) => {
    if (v.estado !== 'completada') return false
    if (!v.fecha_venta) return false
    const d = new Date(v.fecha_venta)
    return !isNaN(d.getTime()) && d >= last7
  })

  const grouped: Record<string, number> = {}
  for (const v of filtered) {
    const date = new Date(v.fecha_venta)
    const key = date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' })
    grouped[key] = (grouped[key] || 0) + Number(v.total || 0)
  }

  const days: SalesByDay[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' })
    days.push({ fecha: key, total: grouped[key] || 0 })
  }

  return days
}

function processPaymentMethods(data: HistorialVentaView[]): PaymentMethodData[] {
  const safe = data ?? []
  const completed = safe.filter((v) => v.estado === 'completada')
  const grouped: Record<string, { cantidad: number; total: number }> = {}

  for (const v of completed) {
    const method = v.metodo_pago || 'otro'
    if (!grouped[method]) {
      grouped[method] = { cantidad: 0, total: 0 }
    }
    grouped[method].cantidad++
    grouped[method].total += Number(v.total || 0)
  }

  const methods = ['efectivo', 'yape', 'plin', 'tarjeta', 'transferencia', 'otro']
  return methods
    .filter((m) => grouped[m])
    .map((m) => ({
      name: PAYMENT_LABELS[m] || m,
      cantidad: grouped[m]?.cantidad || 0,
      total: grouped[m]?.total || 0,
    }))
}

function processInventoryStatus(data: InventarioView[]): InventoryStatus[] {
  const safe = data ?? []
  const grouped: Record<string, number> = {}
  for (const item of safe) {
    const status = item.estado_inventario || 'disponible'
    grouped[status] = (grouped[status] || 0) + 1
  }
  return Object.entries(grouped).map(([key, value]) => ({
    name: INVENTORY_LABELS[key] || key,
    value,
    color: INVENTORY_COLORS[key] || '#6b7280',
  }))
}

function processOrderStatus(data: PedidoPersonalizadoView[]): OrderStatus[] {
  const safe = data ?? []
  const grouped: Record<string, number> = {}
  for (const p of safe) {
    const status = p.estado || 'pendiente'
    grouped[status] = (grouped[status] || 0) + 1
  }
  const order = ['pendiente', 'en_proceso', 'listo', 'entregado', 'cancelado']
  return order
    .filter((s) => grouped[s])
    .map((s) => ({
      name: ORDER_LABELS[s] || s,
      cantidad: grouped[s] || 0,
    }))
}

async function fetchTopProducts(): Promise<TopProduct[]> {
  const { data: detalles, error: errDet } = await supabase
    .from('detalle_ventas')
    .select('producto_id, cantidad, subtotal')
    .limit(5000)

  if (errDet) {
    console.error('Error fetching detalles:', JSON.stringify(errDet, null, 2))
    return []
  }

  const safeDetalles = detalles ?? []
  const grouped: Record<string, { cantidad: number; ingreso: number }> = {}
  for (const d of safeDetalles) {
    const pid = d.producto_id || 'unknown'
    if (!grouped[pid]) {
      grouped[pid] = { cantidad: 0, ingreso: 0 }
    }
    grouped[pid].cantidad += Number(d.cantidad || 0)
    grouped[pid].ingreso += Number(d.subtotal || 0)
  }

  const productIds = Object.keys(grouped).filter((id) => id !== 'unknown')
  if (productIds.length === 0) return []

  const { data: prods, error: errProds } = await supabase
    .from('productos')
    .select('id, nombre')
    .in('id', productIds)

  if (errProds) {
    console.error('Error fetching products:', JSON.stringify(errProds, null, 2))
    return []
  }

  const nameMap: Record<string, string> = {}
  for (const p of prods ?? []) {
    nameMap[p.id] = p.nombre
  }

  const result: TopProduct[] = Object.entries(grouped)
    .filter(([id]) => id !== 'unknown')
    .map(([id, g]) => ({
      nombre: nameMap[id] || 'Producto eliminado',
      cantidad_vendida: g.cantidad,
      ingreso_generado: g.ingreso,
    }))
    .sort((a, b) => b.cantidad_vendida - a.cantidad_vendida)
    .slice(0, 5)

  return result
}

async function fetchFrequentClients(): Promise<FrequentClient[]> {
  const { data, error } = await supabase
    .from('vw_clientes_frecuentes')
    .select('nombre, cantidad_compras, total_compras')
    .order('total_compras', { ascending: false })
    .limit(5)

  if (error) {
    console.error('Error fetching frequent clients:', JSON.stringify(error, null, 2))
    return []
  }

  return (data ?? []).map((c) => ({
    nombre: c.nombre || 'Cliente',
    cantidad_compras: Number(c.cantidad_compras || 0),
    total_compras: Number(c.total_compras || 0),
  }))
}

function buildAlerts(
  resumen: DashboardResumen | null,
  inventario: InventarioView[],
  pedidos: PedidoPersonalizadoView[],
): Alert[] {
  const alerts: Alert[] = []

  const bajoStock = resumen?.productos_bajo_stock ?? 0
  if (bajoStock > 0) {
    alerts.push({
      type: 'warning',
      message: `${bajoStock} producto(s) con bajo stock`,
      detail: 'Revisa el inventario para reabastecer',
    })
  }

  if (inventario) {
    const agotados = inventario.filter((i) => i.estado_inventario === 'agotado').length
    if (agotados > 0) {
      alerts.push({
        type: 'warning',
        message: `${agotados} producto(s) agotados`,
        detail: 'Requieren reposición urgente',
      })
    }
  }

  const pendientesCount = resumen?.pedidos_pendientes ?? 0
  if (pendientesCount > 0) {
    alerts.push({
      type: 'info',
      message: `${pendientesCount} pedido(s) pendiente(s)`,
      detail: 'Revisa la sección de pedidos personalizados',
    })
  }

  if (pedidos) {
    const now = new Date()
    const proximos = pedidos.filter((p) => {
      if (!p.fecha_entrega) return false
      if (p.estado === 'entregado' || p.estado === 'cancelado') return false
      const entrega = new Date(p.fecha_entrega)
      if (isNaN(entrega.getTime())) return false
      const diff = (entrega.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      return diff >= 0 && diff <= 3
    })
    if (proximos.length > 0) {
      alerts.push({
        type: 'info',
        message: `${proximos.length} pedido(s) próximos a entregar`,
        detail: 'Revisa las fechas de entrega en pedidos personalizados',
      })
    }

    const conSaldo = pedidos.filter((p) => {
      const saldo = Number(p.saldo || 0)
      return saldo > 0 && p.estado !== 'entregado' && p.estado !== 'cancelado'
    })
    if (conSaldo.length > 0) {
      alerts.push({
        type: 'info',
        message: `${conSaldo.length} pedido(s) con saldo pendiente`,
        detail: 'Gestiona los cobros pendientes',
      })
    }
  }

  if (alerts.length === 0) {
    alerts.push({
      type: 'success',
      message: 'Sin alertas importantes por el momento.',
      detail: 'Todo está en orden en tu piñatería',
    })
  }

  return alerts
}

export default function Dashboard() {
  const [resumen, setResumen] = useState<DashboardResumen | null>(null)
  const [ventas, setVentas] = useState<HistorialVentaView[]>([])
  const [inventario, setInventario] = useState<InventarioView[]>([])
  const [pedidos, setPedidos] = useState<PedidoPersonalizadoView[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [frequentClients, setFrequentClients] = useState<FrequentClient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [resumenRes, ventasRes, inventarioRes, pedidosRes, topProds, freqClients] =
        await Promise.all([
          supabase.from('vw_dashboard_resumen').select('*').single(),
          supabase.from('vw_historial_ventas').select('*').limit(2000),
          supabase.from('vw_inventario').select('*').limit(2000),
          supabase.from('vw_pedidos_personalizados').select('*').limit(2000),
          fetchTopProducts(),
          fetchFrequentClients(),
        ])

      if (resumenRes.error) {
        console.error('Error resumen:', JSON.stringify(resumenRes.error, null, 2))
        setError(resumenRes.error.message)
        setLoading(false)
        return
      }

      if (ventasRes.error) {
        console.error('Error ventas:', JSON.stringify(ventasRes.error, null, 2))
      }
      if (inventarioRes.error) {
        console.error('Error inventario:', JSON.stringify(inventarioRes.error, null, 2))
      }
      if (pedidosRes.error) {
        console.error('Error pedidos:', JSON.stringify(pedidosRes.error, null, 2))
      }

      setResumen(resumenRes.data)
      setVentas(ventasRes.data ?? [])
      setInventario(inventarioRes.data ?? [])
      setPedidos(pedidosRes.data ?? [])
      setTopProducts(topProds)
      setFrequentClients(freqClients)
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError('Error inesperado al cargar los datos')
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const salesByDay = processSalesByDay(ventas)
  const paymentMethods = processPaymentMethods(ventas)
  const inventoryStatus = processInventoryStatus(inventario)
  const orderStatus = processOrderStatus(pedidos)
  const alerts = buildAlerts(resumen, inventario, pedidos)

  const hasSalesData = salesByDay.some((d) => d.total > 0)
  const hasInventoryData = inventoryStatus.length > 0
  const hasOrderData = orderStatus.length > 0
  const hasPaymentData = paymentMethods.length > 0

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 rounded-lg bg-gray-200" />
          <div className="h-4 w-96 rounded-lg bg-gray-200" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-gray-100" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-72 rounded-2xl bg-gray-100" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Resumen general del estado de tu piñatería</p>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-12 text-center"
        >
          <AlertTriangle className="mb-3 h-12 w-12 text-red-400" />
          <h3 className="mb-1 text-lg font-semibold text-red-800">Error al cargar el Dashboard</h3>
          <p className="mb-4 text-sm text-red-600">{error}</p>
          <button
            onClick={fetchAll}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-fucsia-100 px-3 py-1 text-xs font-medium text-fucsia-700">
              <TrendingUp className="h-3 w-3" />
              En vivo
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Resumen general del estado de tu piñatería
          </p>
          <p className="mt-0.5 text-xs text-gray-400">
            Indicadores actualizados en tiempo real desde Supabase
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 text-sm text-gray-500 sm:flex">
            <Calendar className="h-4 w-4" />
            {todayStr}
          </div>
          <button
            onClick={fetchAll}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-fucsia-500 to-morado-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-fucsia-600 hover:to-morado-600 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar datos
          </button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
        <KpiCard
          icon={ShoppingCart}
          label="Ventas del día"
          value={formatNumber(resumen?.ventas_dia)}
          subtitle={`Total: ${formatCurrency(resumen?.total_ventas_dia)}`}
          color="border-fucsia-100"
          bgColor="bg-fucsia-50"
          iconColor="text-fucsia-500"
          delay={0.05}
        />
        <KpiCard
          icon={DollarSign}
          label="Total vendido hoy"
          value={formatCurrency(resumen?.total_ventas_dia)}
          color="border-morado-100"
          bgColor="bg-morado-50"
          iconColor="text-morado-500"
          delay={0.1}
        />
        <KpiCard
          icon={Package}
          label="Productos registrados"
          value={formatNumber(resumen?.productos_registrados)}
          color="border-blue-100"
          bgColor="bg-blue-50"
          iconColor="text-blue-500"
          delay={0.15}
        />
        <KpiCard
          icon={AlertTriangle}
          label="Productos bajo stock"
          value={formatNumber(resumen?.productos_bajo_stock)}
          color="border-amber-100"
          bgColor="bg-amber-50"
          iconColor="text-amber-500"
          delay={0.2}
        />
        <KpiCard
          icon={ClipboardList}
          label="Pedidos pendientes"
          value={formatNumber(resumen?.pedidos_pendientes)}
          color="border-cyan-100"
          bgColor="bg-cyan-50"
          iconColor="text-cyan-500"
          delay={0.25}
        />
        <KpiCard
          icon={Users}
          label="Clientes registrados"
          value={formatNumber(resumen?.clientes_registrados)}
          color="border-green-100"
          bgColor="bg-green-50"
          iconColor="text-green-500"
          delay={0.3}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {/* Sales Chart */}
        <DashboardChartCard title="Ventas de los últimos 7 días" delay={0.1}>
          {hasSalesData ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={salesByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="fecha" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip
                  formatter={(value) => [formatCurrency(value), 'Total']}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="total" fill="#a855f7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <SimpleEmptyState message="Sin ventas registradas en los últimos 7 días" />
          )}
        </DashboardChartCard>

        {/* Payment Methods */}
        <DashboardChartCard title="Métodos de pago" delay={0.2}>
          {hasPaymentData ? (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={paymentMethods} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} stroke="#9ca3af" width={90} />
                  <Tooltip
                    formatter={(value) => [value, 'Cantidad']}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb' }}
                  />
                  <Bar dataKey="cantidad" fill="#ec4899" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map((pm) => (
                  <div key={pm.name} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs">
                    <span className="font-medium text-gray-600">{pm.name}</span>
                    <span className="text-gray-900">{formatCurrency(pm.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <SimpleEmptyState message="Sin ventas registradas" />
          )}
        </DashboardChartCard>

        {/* Inventory Status */}
        <DashboardChartCard title="Estado del inventario" delay={0.3}>
          {hasInventoryData ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={inventoryStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    label={(entry: { name?: string; percent?: number }) =>
                      `${entry.name ?? ''} ${((entry.percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {inventoryStatus.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [value, 'Productos']}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                {inventoryStatus.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name}: {item.value}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <SimpleEmptyState message="Sin productos en inventario" />
          )}
        </DashboardChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Order Status */}
        <DashboardChartCard title="Estado de pedidos personalizados" delay={0.35}>
          {hasOrderData ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={orderStatus} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} stroke="#9ca3af" width={100} />
                <Tooltip
                  formatter={(value) => [value, 'Pedidos']}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="cantidad" radius={[0, 6, 6, 0]}>
                  {orderStatus.map((entry, idx) => {
                    const colorKey = Object.keys(ORDER_LABELS).find(
                      (k) => ORDER_LABELS[k] === entry.name,
                    )
                    return (
                      <Cell
                        key={`cell-${idx}`}
                        fill={colorKey ? ORDER_COLORS[colorKey] : '#a855f7'}
                      />
                    )
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <SimpleEmptyState message="Sin pedidos personalizados" />
          )}
        </DashboardChartCard>

        {/* Top Products */}
        <DashboardChartCard title="Productos más vendidos" delay={0.4}>
          {topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((p, idx) => (
                <div
                  key={p.nombre}
                  className="flex items-center justify-between rounded-xl border border-gray-50 bg-gray-50/50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-fucsia-500 to-morado-500 text-xs font-bold text-white">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{p.nombre}</p>
                      <p className="text-xs text-gray-400">{p.cantidad_vendida} vendidos</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-700">
                    {formatCurrency(p.ingreso_generado)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <SimpleEmptyState message="Sin productos vendidos todavía" />
          )}
        </DashboardChartCard>
      </div>

      {/* Row 3: Frequent Clients + Alerts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Frequent Clients */}
        <DashboardChartCard
          title="Clientes frecuentes"
          delay={0.45}
          className="order-2 lg:order-1"
        >
          {frequentClients.length > 0 ? (
            <div className="space-y-3">
              {frequentClients.map((c) => (
                <div
                  key={c.nombre}
                  className="flex items-center justify-between rounded-xl border border-gray-50 bg-gray-50/50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500">
                      <Star className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{c.nombre}</p>
                      <p className="text-xs text-gray-400">{c.cantidad_compras} compra(s)</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-700">
                    {formatCurrency(c.total_compras)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <SimpleEmptyState message="Sin clientes frecuentes todavía" />
          )}
        </DashboardChartCard>

        {/* Alerts */}
        <DashboardChartCard
          title="Alertas importantes"
          delay={0.5}
          className="order-1 lg:order-2"
        >
          <div className="space-y-3">
            {alerts.map((alert, idx) => (
              <AlertCard
                key={idx}
                icon={alert.type}
                message={alert.message}
                detail={alert.detail}
              />
            ))}
          </div>
        </DashboardChartCard>
      </div>
    </div>
  )
}
