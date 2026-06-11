import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabaseClient'
import {
  Cliente,
  ProductoView,
  HistorialVentaView,
  CarritoItem,
  DetalleVenta,
} from '../types/database'
import toast from 'react-hot-toast'
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Eye,
  XCircle,
  Search,
  CircleCheck,
} from 'lucide-react'
import DataTable from '../components/DataTable'
import FormModal from '../components/FormModal'
import ConfirmDialog from '../components/ConfirmDialog'
import SearchInput from '../components/SearchInput'

const metodosPago = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'yape', label: 'Yape' },
  { value: 'plin', label: 'Plin' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'otro', label: 'Otro' },
] as const

interface DetalleConProducto extends DetalleVenta {
  producto_nombre?: string
  producto_codigo?: string
}

export default function Ventas() {
  const [tab, setTab] = useState<'nueva' | 'historial'>('nueva')

  // --- Nueva venta state ---
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [productos, setProductos] = useState<ProductoView[]>([])
  const [clienteId, setClienteId] = useState('')
  const [buscarProducto, setBuscarProducto] = useState('')
  const [cart, setCart] = useState<CarritoItem[]>([])
  const [descuento, setDescuento] = useState('')
  const [metodoPago, setMetodoPago] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [saving, setSaving] = useState(false)

  // --- Historial state ---
  const [historial, setHistorial] = useState<HistorialVentaView[]>([])
  const [historialLoading, setHistorialLoading] = useState(false)
  const [historialSearch, setHistorialSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroPago, setFiltroPago] = useState('')

  // --- Detail modal ---
  const [detailTarget, setDetailTarget] = useState<HistorialVentaView | null>(null)
  const [detailItems, setDetailItems] = useState<DetalleConProducto[]>([])
  const [detailLoading, setDetailLoading] = useState(false)

  // --- Anular ---
  const [anularTarget, setAnularTarget] = useState<HistorialVentaView | null>(null)
  const [anulando, setAnulando] = useState(false)

  useEffect(() => {
    fetchClientes()
    fetchProductos()
  }, [])

  // ========== DATA FETCHING ==========

  const fetchClientes = async () => {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('activo', true)
      .order('nombre')

    if (error) {
      console.error('Error Supabase ventas:', JSON.stringify(error, null, 2))
      toast.error('Error al cargar clientes')
    } else {
      setClientes(data ?? [])
    }
  }

  const fetchProductos = async () => {
    const { data, error } = await supabase
      .from('vw_productos')
      .select('*')
      .eq('activo', true)
      .neq('estado', 'descontinuado')
      .gt('stock_actual', 0)
      .order('nombre')

    if (error) {
      console.error('Error Supabase ventas:', JSON.stringify(error, null, 2))
      toast.error('Error al cargar productos')
    } else {
      setProductos(data ?? [])
    }
  }

  const fetchHistorial = async () => {
    setHistorialLoading(true)
    const { data, error } = await supabase
      .from('vw_historial_ventas')
      .select('*')
      .order('fecha_venta', { ascending: false })
      .limit(200)

    if (error) {
      console.error('Error Supabase ventas:', JSON.stringify(error, null, 2))
      toast.error('Error al cargar historial')
    } else {
      setHistorial(data ?? [])
    }
    setHistorialLoading(false)
  }

  // ========== CART LOGIC ==========

  const productosFiltrados = useMemo(() => {
    if (!buscarProducto.trim()) return productos
    const q = buscarProducto.toLowerCase()
    return productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        (p.codigo ?? '').toLowerCase().includes(q) ||
        (p.categoria_nombre ?? '').toLowerCase().includes(q),
    )
  }, [productos, buscarProducto])

  const addToCart = (producto: ProductoView) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.producto_id === producto.id)
      if (existing) {
        if (existing.cantidad >= (producto.stock_actual ?? 0)) {
          toast.error(`Stock insuficiente. Stock disponible: ${producto.stock_actual}`)
          return prev
        }
        return prev.map((i) =>
          i.producto_id === producto.id
            ? {
                ...i,
                cantidad: i.cantidad + 1,
                subtotal: (i.cantidad + 1) * i.precio_unitario,
              }
            : i,
        )
      }
      return [
        ...prev,
        {
          producto_id: producto.id,
          codigo: producto.codigo,
          nombre: producto.nombre,
          precio_unitario: producto.precio_venta,
          cantidad: 1,
          stock_disponible: producto.stock_actual ?? 0,
          subtotal: producto.precio_venta,
        },
      ]
    })
  }

  const updateCartQuantity = (productoId: string, cantidad: number) => {
    if (cantidad <= 0) {
      removeFromCart(productoId)
      return
    }
    setCart((prev) =>
      prev.map((i) => {
        if (i.producto_id !== productoId) return i
        if (cantidad > i.stock_disponible) {
          toast.error(`Stock insuficiente. Stock disponible: ${i.stock_disponible}`)
          return i
        }
        return { ...i, cantidad, subtotal: cantidad * i.precio_unitario }
      }),
    )
  }

  const removeFromCart = (productoId: string) => {
    setCart((prev) => prev.filter((i) => i.producto_id !== productoId))
  }

  const cartSubtotal = useMemo(() => cart.reduce((sum, i) => sum + i.subtotal, 0), [cart])
  const descuentoNum = Number(descuento) || 0
  const cartTotal = Math.max(0, cartSubtotal - descuentoNum)

  // ========== REGISTRAR VENTA ==========

  const handleRegistrarVenta = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!cart.length) {
      toast.error('Agrega al menos un producto al carrito')
      return
    }

    if (!metodoPago) {
      toast.error('Selecciona un método de pago')
      return
    }

    if (descuentoNum < 0) {
      toast.error('El descuento no puede ser negativo')
      return
    }

    if (descuentoNum > cartSubtotal) {
      toast.error('El descuento no puede ser mayor al subtotal')
      return
    }

    for (const item of cart) {
      if (item.cantidad > item.stock_disponible) {
        toast.error(`Stock insuficiente para "${item.nombre}". Disponible: ${item.stock_disponible}`)
        return
      }
    }

    setSaving(true)

    const { data: user } = await supabase.auth.getUser()
    const usuarioId = user.user?.id ?? null

    const ventaPayload = {
      cliente_id: clienteId || null,
      usuario_id: usuarioId,
      subtotal: cartSubtotal,
      descuento: descuentoNum,
      total: cartTotal,
      metodo_pago: metodoPago,
      estado: 'completada',
      observaciones: observaciones.trim() || null,
    }

    const { data: ventaInsert, error: ventaError } = await supabase
      .from('ventas')
      .insert(ventaPayload)
      .select('id')
      .single()

    if (ventaError) {
      console.error('Error Supabase ventas:', JSON.stringify(ventaError, null, 2))
      toast.error(ventaError.message || 'Error al registrar venta')
      setSaving(false)
      return
    }

    const ventaId = ventaInsert.id
    const detallesPayload = cart.map((item) => ({
      venta_id: ventaId,
      producto_id: item.producto_id,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
    }))

    const { error: detalleError } = await supabase
      .from('detalle_ventas')
      .insert(detallesPayload)

    if (detalleError) {
      console.error('Error Supabase ventas:', JSON.stringify(detalleError, null, 2))

      await supabase
        .from('ventas')
        .update({
          estado: 'anulada',
          observaciones: `Anulada automáticamente por error al insertar detalles: ${detalleError.message}`,
        })
        .eq('id', ventaId)

      toast.error(detalleError.message || 'Venta creada pero error al registrar detalles')
      setSaving(false)
      return
    }

    toast.success('Venta registrada correctamente')
    setCart([])
    setClienteId('')
    setDescuento('')
    setMetodoPago('')
    setObservaciones('')
    fetchProductos()
    setSaving(false)
  }

  // ========== HISTORIAL ==========

  useEffect(() => {
    if (tab === 'historial') fetchHistorial()
  }, [tab])

  const historialFiltrado = useMemo(() => {
    let result = [...historial]
    if (historialSearch.trim()) {
      const q = historialSearch.toLowerCase()
      result = result.filter((v) => (v.cliente_nombre ?? '').toLowerCase().includes(q))
    }
    if (filtroEstado) result = result.filter((v) => v.estado === filtroEstado)
    if (filtroPago) result = result.filter((v) => v.metodo_pago === filtroPago)
    return result
  }, [historial, historialSearch, filtroEstado, filtroPago])

  // ========== DETALLE ==========

  const openDetalle = async (venta: HistorialVentaView) => {
    setDetailTarget(venta)
    setDetailLoading(true)

    const { data, error } = await supabase
      .from('detalle_ventas')
      .select('*')
      .eq('venta_id', venta.id)

    if (error) {
      console.error('Error Supabase ventas:', JSON.stringify(error, null, 2))
      toast.error('Error al cargar detalle')
      setDetailLoading(false)
      return
    }

    const items = (data ?? []) as DetalleConProducto[]

    const productIds = items.map((d) => d.producto_id).filter(Boolean) as string[]
    if (productIds.length) {
      const { data: prods } = await supabase
        .from('productos')
        .select('id, nombre, codigo')
        .in('id', productIds)

      if (prods) {
        const prodMap = new Map(prods.map((p) => [p.id, p]))
        for (const item of items) {
          const prod = prodMap.get(item.producto_id ?? '')
          item.producto_nombre = prod?.nombre ?? '(producto eliminado)'
          item.producto_codigo = prod?.codigo ?? ''
        }
      }
    }

    setDetailItems(items)
    setDetailLoading(false)
  }

  // ========== ANULAR ==========

  const handleAnular = async () => {
    if (!anularTarget) return
    setAnulando(true)

    const { data: detalles, error: detError } = await supabase
      .from('detalle_ventas')
      .select('*')
      .eq('venta_id', anularTarget.id)

    if (detError) {
      console.error('Error Supabase ventas:', JSON.stringify(detError, null, 2))
      toast.error('Error al obtener detalles de la venta')
      setAnulando(false)
      return
    }

    const { data: user } = await supabase.auth.getUser()
    const usuarioId = user.user?.id ?? null

    let stockError = false

    for (const det of detalles ?? []) {
      const { data: prod } = await supabase
        .from('productos')
        .select('id, stock_actual')
        .eq('id', det.producto_id)
        .single()

      if (!prod) continue

      const stockAnterior = prod.stock_actual
      const stockNuevo = stockAnterior + det.cantidad

      const { error: updError } = await supabase
        .from('productos')
        .update({
          stock_actual: stockNuevo,
          estado: stockNuevo > 0 ? 'disponible' : 'agotado',
        })
        .eq('id', det.producto_id)

      if (updError) {
        console.error('Error Supabase ventas:', JSON.stringify(updError, null, 2))
        stockError = true
        continue
      }

      await supabase.from('movimientos_inventario').insert({
        producto_id: det.producto_id,
        tipo: 'ajuste',
        cantidad: det.cantidad,
        stock_anterior: stockAnterior,
        stock_nuevo: stockNuevo,
        referencia_tipo: 'anulacion_venta',
        referencia_id: anularTarget.id,
        observacion: 'Stock devuelto por anulación de venta',
        usuario_id: usuarioId,
      })
    }

    const { error: updVentaError } = await supabase
      .from('ventas')
      .update({ estado: 'anulada' })
      .eq('id', anularTarget.id)

    if (updVentaError) {
      console.error('Error Supabase ventas:', JSON.stringify(updVentaError, null, 2))
      toast.error('Error al anular la venta')
      setAnulando(false)
      return
    }

    if (stockError) {
      toast.error('Venta anulada con algunos errores al devolver stock')
    } else {
      toast.success('Venta anulada correctamente')
    }

    setAnularTarget(null)
    setAnulando(false)
    fetchHistorial()
    fetchProductos()
  }

  // ========== HELPERS ==========

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v)

  const formatDate = (f: string) =>
    new Date(f).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const summary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const hoy = historial.filter((v) => v.fecha_venta?.startsWith(today))
    const ventasDia = hoy.length
    const totalDia = hoy.reduce((s, v) => s + v.total, 0)
    const completadas = historial.filter((v) => v.estado === 'completada').length
    const anuladas = historial.filter((v) => v.estado === 'anulada').length
    return { ventasDia, totalDia, completadas, anuladas }
  }, [historial])

  // ========== COLUMNS HISTORIAL ==========

  const historialColumns = [
    {
      key: 'fecha_venta',
      header: 'Fecha',
      render: (v: HistorialVentaView) => (
        <span className="whitespace-nowrap text-gray-600">{formatDate(v.fecha_venta)}</span>
      ),
    },
    {
      key: 'cliente_nombre',
      header: 'Cliente',
      render: (v: HistorialVentaView) => (
        <span className="font-medium text-gray-800">{v.cliente_nombre ?? 'Consumidor final'}</span>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      render: (v: HistorialVentaView) => (
        <span className="font-semibold text-gray-800">{formatCurrency(v.total)}</span>
      ),
    },
    {
      key: 'metodo_pago',
      header: 'Pago',
      render: (v: HistorialVentaView) => {
        const mp = metodosPago.find((m) => m.value === v.metodo_pago)
        return <span className="text-gray-600">{mp?.label ?? v.metodo_pago ?? '—'}</span>
      },
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (v: HistorialVentaView) =>
        v.estado === 'completada' ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
            <CircleCheck className="h-3 w-3" />
            Completada
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
            <XCircle className="h-3 w-3" />
            Anulada
          </span>
        ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      render: (v: HistorialVentaView) => (
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => openDetalle(v)}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
            title="Ver detalle"
          >
            <Eye className="h-4 w-4" />
          </button>
          {v.estado === 'completada' && (
            <button
              type="button"
              onClick={() => setAnularTarget(v)}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
              title="Anular venta"
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ]

  // ========== RENDER ==========

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Ventas</h1>
        <p className="mt-1 text-sm text-gray-500">Registro de ventas y transacciones.</p>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Ventas del día</p>
          <p className="mt-1 text-2xl font-bold text-gray-800">{summary.ventasDia}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Total del día</p>
          <p className="mt-1 text-2xl font-bold text-fucsia-600">{formatCurrency(summary.totalDia)}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Completadas</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{summary.completadas}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Anuladas</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{summary.anuladas}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => setTab('nueva')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'nueva' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Nueva venta
        </button>
        <button
          type="button"
          onClick={() => setTab('historial')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'historial' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Historial
        </button>
      </div>

      {/* ====== NUEVA VENTA ====== */}
      {tab === 'nueva' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Left: products */}
          <div className="lg:col-span-3">
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">Cliente</label>
              <select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
              >
                <option value="">Consumidor final</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}{c.telefono ? ` — ${c.telefono}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <SearchInput
                value={buscarProducto}
                onChange={setBuscarProducto}
                placeholder="Buscar producto por nombre, código o categoría..."
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {productosFiltrados.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-3 shadow-sm transition-colors hover:border-fucsia-200"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800">{p.nombre}</p>
                    <p className="text-xs text-gray-400">
                      {p.codigo ?? '—'} · {p.categoria_nombre ?? '—'}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-fucsia-600">
                      {formatCurrency(p.precio_venta)}
                      <span className="ml-2 text-xs font-normal text-gray-400">
                        Stock: {p.stock_actual}
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addToCart(p)}
                    className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-fucsia-50 text-fucsia-600 transition-colors hover:bg-fucsia-100"
                    title="Agregar al carrito"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {!productosFiltrados.length && (
                <p className="col-span-full py-4 text-center text-sm text-gray-400">
                  {buscarProducto ? 'No se encontraron productos.' : 'No hay productos disponibles con stock.'}
                </p>
              )}
            </div>
          </div>

          {/* Right: cart */}
          <div className="lg:col-span-2">
            <div className="sticky top-6 rounded-xl border border-gray-100 bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
                <ShoppingCart className="h-5 w-5 text-fucsia-500" />
                <h2 className="font-semibold text-gray-800">Carrito</h2>
                {!!cart.length && (
                  <span className="ml-auto rounded-full bg-fucsia-100 px-2.5 py-0.5 text-xs font-medium text-fucsia-700">
                    {cart.length}
                  </span>
                )}
              </div>

              {!cart.length ? (
                <div className="flex flex-col items-center py-8 text-gray-300">
                  <ShoppingCart className="mb-2 h-8 w-8" />
                  <p className="text-sm">Carrito vacío</p>
                </div>
              ) : (
                <div className="max-h-64 space-y-2 overflow-y-auto px-4 py-3">
                  {cart.map((item) => (
                    <div key={item.producto_id} className="flex items-center gap-2 rounded-lg bg-gray-50 p-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-gray-800">{item.nombre}</p>
                        <p className="text-xs text-gray-400">{formatCurrency(item.precio_unitario)} c/u</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.producto_id, item.cantidad - 1)}
                          className="flex h-6 w-6 items-center justify-center rounded bg-white text-gray-500 transition-colors hover:bg-gray-200"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={item.stock_disponible}
                          value={item.cantidad}
                          onChange={(e) => updateCartQuantity(item.producto_id, Number(e.target.value))}
                          className="h-6 w-10 rounded border border-gray-200 text-center text-xs font-medium outline-none focus:border-fucsia-400"
                        />
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.producto_id, item.cantidad + 1)}
                          className="flex h-6 w-6 items-center justify-center rounded bg-white text-gray-500 transition-colors hover:bg-gray-200"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="w-16 text-right text-xs font-semibold text-gray-800">
                        {formatCurrency(item.subtotal)}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.producto_id)}
                        className="flex h-6 w-6 items-center justify-center rounded text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-gray-100 px-4 py-3">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium text-gray-800">{formatCurrency(cartSubtotal)}</span>
                </div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-sm text-gray-500">Descuento</span>
                  <input
                    type="number"
                    min="0"
                    value={descuento}
                    onChange={(e) => setDescuento(e.target.value)}
                    className="ml-auto h-8 w-24 rounded border border-gray-200 px-2 text-right text-sm outline-none focus:border-fucsia-400"
                    placeholder="0"
                  />
                </div>
                {descuentoNum > cartSubtotal && (
                  <p className="mb-1 text-xs text-red-500">El descuento supera el subtotal</p>
                )}
                <div className="flex justify-between border-t border-gray-100 pt-2 text-sm font-semibold">
                  <span className="text-gray-800">Total</span>
                  <span className="text-fucsia-600">{formatCurrency(cartTotal)}</span>
                </div>
              </div>

              <div className="border-t border-gray-100 px-4 py-3">
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  required
                  className="mb-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
                >
                  <option value="">Seleccionar método de pago</option>
                  {metodosPago.map((mp) => (
                    <option key={mp.value} value={mp.value}>{mp.label}</option>
                  ))}
                </select>

                <input
                  type="text"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="mb-3 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
                  placeholder="Observaciones (opcional)"
                />

                <button
                  type="button"
                  onClick={handleRegistrarVenta}
                  disabled={saving || !cart.length || !metodoPago}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-fucsia-500 to-morado-600 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-fucsia-200 transition-all hover:from-fucsia-600 hover:to-morado-700 disabled:opacity-60"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {saving ? 'Registrando...' : 'Registrar venta'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== HISTORIAL ====== */}
      {tab === 'historial' && (
        <div>
          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-4">
            <SearchInput
              value={historialSearch}
              onChange={setHistorialSearch}
              placeholder="Buscar por cliente..."
            />
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
            >
              <option value="">Todos los estados</option>
              <option value="completada">Completada</option>
              <option value="anulada">Anulada</option>
            </select>
            <select
              value={filtroPago}
              onChange={(e) => setFiltroPago(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
            >
              <option value="">Todos los pagos</option>
              {metodosPago.map((mp) => (
                <option key={mp.value} value={mp.value}>{mp.label}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={fetchHistorial}
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              <Search className="h-4 w-4" />
              Actualizar
            </button>
          </div>

          <DataTable
            columns={historialColumns}
            data={historialFiltrado}
            loading={historialLoading}
            emptyMessage="No se encontraron ventas."
            keyExtractor={(v) => v.id}
          />
        </div>
      )}

      {/* ====== DETALLE MODAL ====== */}
      <FormModal
        isOpen={!!detailTarget}
        onClose={() => setDetailTarget(null)}
        title={`Venta — ${detailTarget ? formatCurrency(detailTarget.total) : ''}`}
        size="lg"
      >
        {detailLoading ? (
          <p className="py-8 text-center text-sm text-gray-400">Cargando detalle...</p>
        ) : detailTarget ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Cliente</p>
                <p className="mt-1 font-medium text-gray-800">{detailTarget.cliente_nombre ?? 'Consumidor final'}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Fecha</p>
                <p className="mt-1 text-gray-600">{formatDate(detailTarget.fecha_venta)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Método de pago</p>
                <p className="mt-1 text-gray-600">
                  {metodosPago.find((m) => m.value === detailTarget.metodo_pago)?.label ?? detailTarget.metodo_pago ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Estado</p>
                <p className="mt-1">
                  {detailTarget.estado === 'completada' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                      <CircleCheck className="h-3 w-3" /> Completada
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                      <XCircle className="h-3 w-3" /> Anulada
                    </span>
                  )}
                </p>
              </div>
            </div>

            {detailTarget.observaciones && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Observaciones</p>
                <p className="mt-1 text-sm text-gray-600">{detailTarget.observaciones}</p>
              </div>
            )}

            <div className="border-t border-gray-100 pt-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">Productos</h3>
              {detailItems.length === 0 ? (
                <p className="text-sm text-gray-400">No hay productos registrados en esta venta.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <th className="px-3 py-2">Producto</th>
                      <th className="px-3 py-2 text-right">Cantidad</th>
                      <th className="px-3 py-2 text-right">Precio unit.</th>
                      <th className="px-3 py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {detailItems.map((d) => (
                      <tr key={d.id} className="transition-colors hover:bg-gray-50/50">
                        <td className="px-3 py-2.5">
                          <p className="font-medium text-gray-800">
                            {d.producto_nombre ?? 'Producto'}
                          </p>
                          {d.producto_codigo && (
                            <p className="text-xs text-gray-400">{d.producto_codigo}</p>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right text-gray-600">
                          {d.cantidad}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right text-gray-600">
                          {formatCurrency(d.precio_unitario)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right font-medium text-gray-800">
                          {formatCurrency(d.subtotal ?? d.cantidad * d.precio_unitario)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-gray-100 font-semibold">
                      <td className="px-3 py-2 text-gray-700" colSpan={3}>Subtotal</td>
                      <td className="px-3 py-2 text-right text-gray-800">{formatCurrency(detailTarget.subtotal)}</td>
                    </tr>
                    <tr className="text-sm">
                      <td className="px-3 py-1 text-gray-500" colSpan={3}>Descuento</td>
                      <td className="px-3 py-1 text-right text-gray-500">-{formatCurrency(detailTarget.descuento)}</td>
                    </tr>
                    <tr className="border-t border-gray-100 font-bold">
                      <td className="px-3 py-2 text-gray-800" colSpan={3}>Total</td>
                      <td className="px-3 py-2 text-right text-fucsia-600">{formatCurrency(detailTarget.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        ) : null}
      </FormModal>

      {/* ====== ANULAR CONFIRM ====== */}
      <ConfirmDialog
        isOpen={!!anularTarget}
        onClose={() => setAnularTarget(null)}
        onConfirm={handleAnular}
        title="Anular venta"
        message={`¿Estás seguro de anular la venta a "${anularTarget?.cliente_nombre ?? 'Consumidor final'}" por ${anularTarget ? formatCurrency(anularTarget.total) : ''}? Esta acción devolverá el stock de todos los productos.`}
        confirmText="Anular venta"
        loading={anulando}
      />
    </motion.div>
  )
}
