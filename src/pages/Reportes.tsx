import { useEffect, useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabaseClient'
import {
  DashboardResumen,
  HistorialVentaView,
  InventarioView,
  ClienteFrecuenteView,
  PedidoPersonalizadoView,
  ProductoMasVendido,
} from '../types/database'
import toast from 'react-hot-toast'
import {
  BarChart3,
  TrendingUp,
  Package,
  AlertTriangle,
  XCircle,
  Users,
  ClipboardList,
  DollarSign,
  Filter,
  RotateCcw,
  CircleCheck,
} from 'lucide-react'
import DataTable from '../components/DataTable'
import SimpleBarChart from '../components/SimpleBarChart'

const metodosPagoLabels: Record<string, string> = {
  efectivo: 'Efectivo',
  yape: 'Yape',
  plin: 'Plin',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  otro: 'Otro',
}

const estadoPedidoLabels: Record<string, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  listo: 'Listo',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

export default function Reportes() {
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [filtrosAplicados, setFiltrosAplicados] = useState(false)

  const [loading, setLoading] = useState(true)

  // Raw data
  const [dashboard, setDashboard] = useState<DashboardResumen | null>(null)
  const [ventas, setVentas] = useState<HistorialVentaView[]>([])
  const [inventario, setInventario] = useState<InventarioView[]>([])
  const [clientes, setClientes] = useState<ClienteFrecuenteView[]>([])
  const [pedidos, setPedidos] = useState<PedidoPersonalizadoView[]>([])
  const [detalleVentas, setDetalleVentas] = useState<{ producto_id: string; cantidad: number; subtotal: number | null }[]>([])

  const today = new Date().toISOString().slice(0, 10)

  function formatCurrency(value: unknown): string {
    const numberValue = Number(value || 0)
    return `S/ ${numberValue.toFixed(2)}`
  }

  function formatDate(value: string | null | undefined): string {
    if (!value) return 'Sin fecha'
    const date = new Date(value)
    if (isNaN(date.getTime())) return 'Sin fecha'
    return date.toLocaleDateString('es-PE')
  }

  const fetchData = useCallback(async () => {
    setLoading(true)

    const inicio = fechaInicio || '2000-01-01'
    const fin = fechaFin || '2099-12-31'

    const results = await Promise.all([
      supabase.from('vw_dashboard_resumen').select('*').single(),
      supabase.from('vw_historial_ventas').select('*').gte('fecha_venta', inicio).lte('fecha_venta', fin).order('fecha_venta', { ascending: false }),
      supabase.from('vw_inventario').select('*').order('nombre'),
      supabase.from('vw_clientes_frecuentes').select('*').eq('activo', true).order('total_compras', { ascending: false }),
      supabase.from('vw_pedidos_personalizados').select('*').order('created_at', { ascending: false }),
      supabase.from('detalle_ventas').select('producto_id, cantidad, subtotal'),
    ])

    const [dashRes, ventasRes, invRes, cliRes, pedRes, detRes] = results

    if (dashRes.error) console.error('Error Supabase reportes:', JSON.stringify(dashRes.error, null, 2))
    else setDashboard(dashRes.data)
    if (ventasRes.error) console.error('Error Supabase reportes:', JSON.stringify(ventasRes.error, null, 2))
    else setVentas(ventasRes.data ?? [])
    if (invRes.error) console.error('Error Supabase reportes:', JSON.stringify(invRes.error, null, 2))
    else setInventario(invRes.data ?? [])
    if (cliRes.error) console.error('Error Supabase reportes:', JSON.stringify(cliRes.error, null, 2))
    else setClientes(cliRes.data ?? [])
    if (pedRes.error) console.error('Error Supabase reportes:', JSON.stringify(pedRes.error, null, 2))
    else setPedidos(pedRes.data ?? [])
    if (detRes.error) console.error('Error Supabase reportes:', JSON.stringify(detRes.error, null, 2))
    else setDetalleVentas(detRes.data ?? [])

    setLoading(false)
  }, [fechaInicio, fechaFin])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const aplicarFiltros = () => {
    if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
      toast.error('La fecha de inicio no puede ser mayor a la fecha de fin')
      return
    }
    setFiltrosAplicados(true)
    fetchData()
    toast.success('Filtro aplicado')
  }

  const limpiarFiltros = () => {
    setFechaInicio('')
    setFechaFin('')
    setFiltrosAplicados(false)
  }

  // ---- Computed metrics ----

  const ventasCompletadas = useMemo(() => ventas.filter((v) => v.estado === 'completada'), [ventas])
  const ventasAnuladas = useMemo(() => ventas.filter((v) => v.estado === 'anulada'), [ventas])

  const totalVendido = useMemo(() => ventasCompletadas.reduce((s, v) => s + v.total, 0), [ventasCompletadas])
  const totalDescuentos = useMemo(() => ventasCompletadas.reduce((s, v) => s + v.descuento, 0), [ventasCompletadas])
  const promedioVenta = ventasCompletadas.length ? totalVendido / ventasCompletadas.length : 0

  const ventasPorMetodo = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {}
    for (const v of ventasCompletadas) {
      const key = v.metodo_pago ?? 'otro'
      if (!map[key]) map[key] = { count: 0, total: 0 }
      map[key].count++
      map[key].total += v.total
    }
    return Object.entries(map)
      .map(([metodo, data]) => ({
        metodo,
        label: metodosPagoLabels[metodo] ?? metodo,
        count: data.count,
        total: data.total,
      }))
      .sort((a, b) => b.total - a.total)
  }, [ventasCompletadas])

  const productosMasVendidos = useMemo(() => {
    const grouped: Record<string, { cantidad: number; ingreso: number }> = {}
    for (const d of detalleVentas) {
      if (!d.producto_id) continue
      if (!grouped[d.producto_id]) grouped[d.producto_id] = { cantidad: 0, ingreso: 0 }
      grouped[d.producto_id].cantidad += d.cantidad
      grouped[d.producto_id].ingreso += d.subtotal ?? 0
    }
    return Object.entries(grouped)
      .map(([id, data]) => ({ producto_id: id, ...data }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 20)
  }, [detalleVentas])

  const [productosMap, setProductosMap] = useState<Map<string, { nombre: string; codigo: string }>>(new Map())

  useEffect(() => {
    if (!productosMasVendidos.length) return
    const ids = productosMasVendidos.map((p) => p.producto_id)
    supabase
      .from('productos')
      .select('id, nombre, codigo')
      .in('id', ids)
      .then(({ data }) => {
        if (data) {
          const m = new Map(data.map((p) => [p.id, { nombre: p.nombre, codigo: p.codigo ?? '' }]))
          setProductosMap(m)
        }
      })
  }, [productosMasVendidos.length])

  const productosMasVendidosConNombre: ProductoMasVendido[] = useMemo(
    () =>
      productosMasVendidos.map((p) => {
        const info = productosMap.get(p.producto_id) ?? { nombre: '(producto eliminado)', codigo: '' }
        return {
          producto_id: p.producto_id,
          codigo: info.codigo,
          nombre: info.nombre,
          cantidad_vendida: p.cantidad,
          ingreso_generado: p.ingreso,
        }
      }),
    [productosMasVendidos, productosMap],
  )

  const invDisponibles = inventario.filter((i) => i.estado_inventario === 'disponible').length
  const invBajoStock = inventario.filter((i) => i.estado_inventario === 'bajo_stock').length
  const invAgotados = inventario.filter((i) => i.estado_inventario === 'agotado').length

  const invOrdenado = useMemo(
    () =>
      [...inventario].sort((a, b) => {
        const order: Record<string, number> = { agotado: 0, bajo_stock: 1, disponible: 2 }
        return (order[a.estado_inventario ?? ''] ?? 3) - (order[b.estado_inventario ?? ''] ?? 3)
      }),
    [inventario],
  )

  const pedidosStats = useMemo(() => {
    const pendientes = pedidos.filter((p) => p.estado === 'pendiente').length
    const enProceso = pedidos.filter((p) => p.estado === 'en_proceso').length
    const listos = pedidos.filter((p) => p.estado === 'listo').length
    const entregados = pedidos.filter((p) => p.estado === 'entregado').length
    const cancelados = pedidos.filter((p) => p.estado === 'cancelado').length
    const saldoTotal = pedidos.reduce((s, p) => s + (p.saldo ?? p.total - p.adelanto), 0)
    return { pendientes, enProceso, listos, entregados, cancelados, saldoTotal }
  }, [pedidos])

  const pedidosOrdenados = useMemo(
    () =>
      [...pedidos].sort((a, b) => {
        const pend = a.estado === 'pendiente' || a.estado === 'en_proceso' ? 0 : 1
        const pendB = b.estado === 'pendiente' || b.estado === 'en_proceso' ? 0 : 1
        if (pend !== pendB) return pend - pendB
        return (a.fecha_entrega ?? '').localeCompare(b.fecha_entrega ?? '')
      }),
    [pedidos],
  )

  const alertas = useMemo(() => {
    const list: string[] = []
    if (invAgotados > 0) list.push(`Hay ${invAgotados} producto(s) agotado(s).`)
    if (invBajoStock > 0) list.push(`Hay ${invBajoStock} producto(s) con bajo stock.`)
    const proximos = pedidos.filter(
      (p) =>
        (p.estado === 'pendiente' || p.estado === 'en_proceso') &&
        p.fecha_entrega &&
        p.fecha_entrega <= today,
    )
    if (proximos.length) list.push(`Hay ${proximos.length} pedido(s) pendientes con fecha de entrega vencida o para hoy.`)
    if (pedidosStats.saldoTotal > 0) list.push(`Hay ${formatCurrency(pedidosStats.saldoTotal)} en saldos pendientes de pedidos personalizados.`)
    if (ventasAnuladas.length > 0) list.push(`Hay ${ventasAnuladas.length} venta(s) anulada(s) en el rango seleccionado.`)
    return list
  }, [invAgotados, invBajoStock, pedidos, pedidosStats.saldoTotal, ventasAnuladas.length, today])

  // ---- Tables columns ----

  const ventasColumns = [
    { key: 'fecha_venta', header: 'Fecha', render: (v: HistorialVentaView) => <span className="text-gray-600">{formatDate(v.fecha_venta)}</span> },
    { key: 'cliente_nombre', header: 'Cliente', render: (v: HistorialVentaView) => <span className="font-medium text-gray-800">{v.cliente_nombre ?? 'Consumidor final'}</span> },
    { key: 'total', header: 'Total', render: (v: HistorialVentaView) => <span className="font-semibold text-gray-800">{formatCurrency(v.total)}</span> },
    {
      key: 'metodo_pago',
      header: 'Pago',
      render: (v: HistorialVentaView) => <span className="text-gray-600">{metodosPagoLabels[v.metodo_pago ?? ''] ?? v.metodo_pago ?? '—'}</span>,
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (v: HistorialVentaView) =>
        v.estado === 'completada' ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
            <CircleCheck className="h-3 w-3" /> Completada
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
            <XCircle className="h-3 w-3" /> Anulada
          </span>
        ),
    },
  ]

  const invColumns = [
    { key: 'codigo', header: 'Código', render: (i: InventarioView) => <span className="font-medium text-gray-900">{i.codigo ?? '—'}</span> },
    { key: 'nombre', header: 'Producto', render: (i: InventarioView) => <span className="font-medium text-gray-800">{i.nombre}</span> },
    { key: 'categoria_nombre', header: 'Categoría', render: (i: InventarioView) => <span className="text-gray-600">{i.categoria_nombre ?? '—'}</span> },
    { key: 'stock_actual', header: 'Stock', render: (i: InventarioView) => <span className="font-semibold text-gray-800">{i.stock_actual}</span> },
    { key: 'stock_minimo', header: 'Stock mín.', render: (i: InventarioView) => <span className="text-gray-600">{i.stock_minimo}</span> },
    {
      key: 'estado_inventario',
      header: 'Estado',
      render: (i: InventarioView) => {
        const colors: Record<string, string> = {
          disponible: 'bg-green-100 text-green-700',
          bajo_stock: 'bg-amber-100 text-amber-700',
          agotado: 'bg-red-100 text-red-700',
        }
        const labels: Record<string, string> = {
          disponible: 'Disponible',
          bajo_stock: 'Bajo stock',
          agotado: 'Agotado',
        }
        return (
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[i.estado_inventario ?? ''] ?? 'bg-gray-100 text-gray-600'}`}>
            {labels[i.estado_inventario ?? ''] ?? i.estado_inventario ?? '—'}
          </span>
        )
      },
    },
  ]

  const clientesColumns = [
    { key: 'nombre', header: 'Cliente', render: (c: ClienteFrecuenteView) => <span className="font-medium text-gray-800">{c.nombre}</span> },
    { key: 'telefono', header: 'Teléfono', render: (c: ClienteFrecuenteView) => <span className="text-gray-600">{c.telefono ?? '—'}</span> },
    { key: 'cantidad_compras', header: 'Compras', render: (c: ClienteFrecuenteView) => <span className="font-semibold text-gray-800">{c.cantidad_compras ?? 0}</span> },
    { key: 'total_compras', header: 'Total', render: (c: ClienteFrecuenteView) => <span className="font-semibold text-gray-800">{formatCurrency(c.total_compras ?? 0)}</span> },
    { key: 'ultima_compra', header: 'Última compra', render: (c: ClienteFrecuenteView) => <span className="text-gray-600">{c.ultima_compra ? formatDate(c.ultima_compra) : '—'}</span> },
  ]

  const pedidosColumns = [
    { key: 'codigo_pedido', header: 'Código', render: (p: PedidoPersonalizadoView) => <span className="font-medium text-gray-900">{p.codigo_pedido ?? '—'}</span> },
    { key: 'cliente_nombre', header: 'Cliente', render: (p: PedidoPersonalizadoView) => <span className="font-medium text-gray-800">{p.cliente_nombre ?? '—'}</span> },
    { key: 'fecha_entrega', header: 'Entrega', render: (p: PedidoPersonalizadoView) => <span className="text-gray-600">{p.fecha_entrega ? formatDate(p.fecha_entrega) : '—'}</span> },
    { key: 'total', header: 'Total', render: (p: PedidoPersonalizadoView) => <span className="font-semibold text-gray-800">{formatCurrency(p.total)}</span> },
    { key: 'adelanto', header: 'Adelanto', render: (p: PedidoPersonalizadoView) => <span className="text-gray-600">{formatCurrency(p.adelanto)}</span> },
    {
      key: 'saldo',
      header: 'Saldo',
      render: (p: PedidoPersonalizadoView) => {
        const saldo = p.saldo ?? p.total - p.adelanto
        return <span className={`font-semibold ${saldo > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(saldo)}</span>
      },
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (p: PedidoPersonalizadoView) => {
        const colors: Record<string, string> = {
          pendiente: 'bg-amber-100 text-amber-700',
          en_proceso: 'bg-blue-100 text-blue-700',
          listo: 'bg-green-100 text-green-700',
          entregado: 'bg-emerald-100 text-emerald-700',
          cancelado: 'bg-red-100 text-red-700',
        }
        return (
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[p.estado ?? ''] ?? 'bg-gray-100 text-gray-600'}`}>
            {estadoPedidoLabels[p.estado ?? ''] ?? p.estado ?? '—'}
          </span>
        )
      },
    },
  ]

  const productosVendidosColumns = [
    { key: 'codigo', header: 'Código', render: (p: ProductoMasVendido) => <span className="font-medium text-gray-900">{p.codigo ?? '—'}</span> },
    { key: 'nombre', header: 'Producto', render: (p: ProductoMasVendido) => <span className="font-medium text-gray-800">{p.nombre}</span> },
    { key: 'cantidad_vendida', header: 'Cant. vendida', render: (p: ProductoMasVendido) => <span className="font-semibold text-gray-800">{p.cantidad_vendida}</span> },
    { key: 'ingreso_generado', header: 'Ingreso', render: (p: ProductoMasVendido) => <span className="font-semibold text-gray-800">{formatCurrency(p.ingreso_generado)}</span> },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Reportes</h1>
        <p className="mt-1 text-sm text-gray-500">
          Consulta indicadores de ventas, inventario, clientes y pedidos personalizados.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-400">Fecha inicio</label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-400">Fecha fin</label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
          />
        </div>
        <button
          type="button"
          onClick={aplicarFiltros}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-fucsia-500 to-morado-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-fucsia-600 hover:to-morado-700"
        >
          <Filter className="h-4 w-4" />
          Aplicar filtros
        </button>
        <button
          type="button"
          onClick={limpiarFiltros}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          <RotateCcw className="h-4 w-4" />
          Limpiar
        </button>
        {filtrosAplicados && (
          <span className="text-xs text-gray-400">
            Mostrando datos desde {fechaInicio || 'siempre'} hasta {fechaFin || 'siempre'}
          </span>
        )}
      </div>

      {/* ====== SUMMARY CARDS ====== */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <SummaryCard label="Ventas del día" value={dashboard?.ventas_dia ?? '—'} icon={TrendingUp} color="text-fucsia-600" />
        <SummaryCard label="Total vendido hoy" value={dashboard?.total_ventas_dia != null ? formatCurrency(dashboard.total_ventas_dia) : '—'} icon={DollarSign} color="text-green-600" />
        <SummaryCard label="Total rango" value={formatCurrency(totalVendido)} icon={DollarSign} color="text-fucsia-600" />
        <SummaryCard label="Completadas" value={ventasCompletadas.length} icon={CircleCheck} color="text-green-600" />
        <SummaryCard label="Anuladas" value={ventasAnuladas.length} icon={XCircle} color="text-red-600" />
        <SummaryCard label="Productos" value={dashboard?.productos_registrados ?? inventario.length} icon={Package} color="text-morado-600" />
        <SummaryCard label="Bajo stock" value={invBajoStock} icon={AlertTriangle} color="text-amber-600" />
        <SummaryCard label="Agotados" value={invAgotados} icon={XCircle} color="text-red-600" />
        <SummaryCard label="Clientes" value={dashboard?.clientes_registrados ?? clientes.length} icon={Users} color="text-blue-600" />
        <SummaryCard label="Pedidos pend." value={pedidosStats.pendientes} icon={ClipboardList} color="text-amber-600" />
      </motion.div>

      {loading && <p className="py-8 text-center text-sm text-gray-400">Cargando reportes...</p>}

      {!loading && (
        <div className="space-y-8">
          {/* ====== RESUMEN DE VENTAS ====== */}
          <Section icon={BarChart3} title="Resumen de ventas" subtitle={filtrosAplicados ? `Del ${fechaInicio || 'inicio'} al ${fechaFin || 'hoy'}` : 'Todos los registros'}>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <MetricCard label="Ventas completadas" value={ventasCompletadas.length} />
              <MetricCard label="Total vendido" value={formatCurrency(totalVendido)} highlight />
              <MetricCard label="Descuentos aplicados" value={formatCurrency(totalDescuentos)} />
              <MetricCard label="Promedio por venta" value={formatCurrency(promedioVenta)} />
            </div>
            <div className="mt-1 text-xs text-gray-400">
              Ventas anuladas: {ventasAnuladas.length}
            </div>
            <div className="mt-4">
              <DataTable columns={ventasColumns} data={ventas} loading={false} emptyMessage="No hay ventas en el rango seleccionado." keyExtractor={(v) => v.id} />
            </div>
          </Section>

          {/* ====== VENTAS POR MÉTODO DE PAGO ====== */}
          <Section icon={DollarSign} title="Ventas por método de pago">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <SimpleBarChart
                data={ventasPorMetodo.map((m) => ({
                  label: m.label,
                  value: m.total,
                  color: m.metodo === 'efectivo' ? '#ec4899' : m.metodo === 'yape' ? '#a855f7' : m.metodo === 'plin' ? '#facc15' : m.metodo === 'tarjeta' ? '#3b82f6' : m.metodo === 'transferencia' ? '#10b981' : '#6b7280',
                }))}
                formatValue={(v) => formatCurrency(v)}
              />
              <div className="space-y-2">
                {ventasPorMetodo.map((m) => (
                  <div key={m.metodo} className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{m.label}</p>
                      <p className="text-xs text-gray-400">{m.count} venta(s)</p>
                    </div>
                    <span className="font-semibold text-gray-800">{formatCurrency(m.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* ====== PRODUCTOS MÁS VENDIDOS ====== */}
          <Section icon={Package} title="Productos más vendidos">
            {productosMasVendidosConNombre.length === 0 ? (
              <p className="text-sm text-gray-400">No hay datos de productos vendidos en el rango seleccionado.</p>
            ) : (
              <DataTable columns={productosVendidosColumns} data={productosMasVendidosConNombre.slice(0, 10)} loading={false} emptyMessage="—" keyExtractor={(p) => p.producto_id} />
            )}
          </Section>

          {/* ====== ESTADO DE INVENTARIO ====== */}
          <Section icon={Package} title="Estado de inventario">
            <div className="mb-4 grid grid-cols-3 gap-4">
              <MetricCard label="Disponibles" value={invDisponibles} color="text-green-600" />
              <MetricCard label="Bajo stock" value={invBajoStock} color="text-amber-600" />
              <MetricCard label="Agotados" value={invAgotados} color="text-red-600" />
            </div>
            <DataTable columns={invColumns} data={invOrdenado} loading={false} emptyMessage="No hay productos en el inventario." keyExtractor={(i) => i.id} />
          </Section>

          {/* ====== CLIENTES FRECUENTES ====== */}
          <Section icon={Users} title="Clientes frecuentes">
            <DataTable columns={clientesColumns} data={clientes.slice(0, 20)} loading={false} emptyMessage="No hay clientes frecuentes." keyExtractor={(c) => c.id} />
          </Section>

          {/* ====== PEDIDOS PERSONALIZADOS ====== */}
          <Section icon={ClipboardList} title="Pedidos personalizados">
            <div className="mb-4 grid grid-cols-3 gap-4 sm:grid-cols-6">
              <MetricCard label="Pendientes" value={pedidosStats.pendientes} color="text-amber-600" />
              <MetricCard label="En proceso" value={pedidosStats.enProceso} color="text-blue-600" />
              <MetricCard label="Listos" value={pedidosStats.listos} color="text-green-600" />
              <MetricCard label="Entregados" value={pedidosStats.entregados} color="text-emerald-600" />
              <MetricCard label="Cancelados" value={pedidosStats.cancelados} color="text-red-600" />
              <MetricCard label="Saldo pend." value={formatCurrency(pedidosStats.saldoTotal)} color="text-red-600" />
            </div>
            <DataTable columns={pedidosColumns} data={pedidosOrdenados} loading={false} emptyMessage="No hay pedidos personalizados." keyExtractor={(p) => p.id} />
          </Section>

          {/* ====== ALERTAS ====== */}
          <Section icon={AlertTriangle} title="Alertas del negocio">
            {alertas.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                <CircleCheck className="h-5 w-5 shrink-0" />
                Sin alertas importantes por el momento.
              </div>
            ) : (
              <ul className="space-y-2">
                {alertas.map((a, i) => (
                  <li key={i} className="flex items-start gap-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    {a}
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      )}
    </motion.div>
  )
}

// ---- Sub-components ----

function SummaryCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }>; color: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{label}</p>
          <p className={`mt-1 text-xl font-bold ${color}`}>{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color.replace('text-', 'bg-')} bg-opacity-10`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, color, highlight }: { label: string; value: string | number; color?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border border-gray-100 px-4 py-3 ${highlight ? 'bg-fucsia-50 border-fucsia-200' : 'bg-white'}`}>
      <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{label}</p>
      <p className={`mt-1 text-lg font-bold ${color ?? 'text-gray-800'}`}>{value}</p>
    </div>
  )
}

function Section({ icon: Icon, title, subtitle, children }: { icon: React.ComponentType<{ className?: string }>; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-fucsia-500 to-morado-600 text-white">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
      </div>
      {children}
    </motion.div>
  )
}
