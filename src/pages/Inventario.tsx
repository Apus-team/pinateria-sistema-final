import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabaseClient'
import { InventarioView, MovimientoInventario } from '../types/database'
import toast from 'react-hot-toast'
import {
  Package,
  CircleCheck,
  AlertTriangle,
  XCircle,
  Pencil,
  List,
  ArrowDown,
  ArrowUp,
} from 'lucide-react'
import DataTable from '../components/DataTable'
import FormModal from '../components/FormModal'
import SearchInput from '../components/SearchInput'

type ModalType = 'entrada' | 'ajuste' | 'salida' | 'movimientos' | null

export default function Inventario() {
  const [items, setItems] = useState<InventarioView[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  const [modal, setModal] = useState<ModalType>(null)
  const [selected, setSelected] = useState<InventarioView | null>(null)
  const [productoId, setProductoId] = useState('')
  const [saving, setSaving] = useState(false)
  const [currentStock, setCurrentStock] = useState<number>(0)

  const [entradaCantidad, setEntradaCantidad] = useState('')
  const [entradaObservacion, setEntradaObservacion] = useState('')

  const [ajusteNuevoStock, setAjusteNuevoStock] = useState('')
  const [ajusteObservacion, setAjusteObservacion] = useState('')

  const [salidaCantidad, setSalidaCantidad] = useState('')
  const [salidaObservacion, setSalidaObservacion] = useState('')

  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([])
  const [movimientosLoading, setMovimientosLoading] = useState(false)
  const [movimientosProducto, setMovimientosProducto] = useState<string>('')

  useEffect(() => {
    fetchInventario()
  }, [])

  const fetchInventario = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('vw_inventario')
      .select('*')
      .order('nombre', { ascending: true })

    if (error) {
      toast.error('Error al cargar inventario')
      console.error('Error Supabase inventario:', JSON.stringify(error, null, 2))
    } else {
      setItems(data ?? [])
    }
    setLoading(false)
  }

  const summary = useMemo(() => {
    const total = items.length
    const disponibles = items.filter((i) => i.estado_inventario === 'disponible').length
    const bajoStock = items.filter((i) => i.estado_inventario === 'bajo_stock').length
    const agotados = items.filter((i) => i.estado_inventario === 'agotado').length
    return { total, disponibles, bajoStock, agotados }
  }, [items])

  const filtered = useMemo(() => {
    let result = [...items]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (i) =>
          i.nombre.toLowerCase().includes(q) ||
          (i.codigo ?? '').toLowerCase().includes(q) ||
          (i.categoria_nombre ?? '').toLowerCase().includes(q),
      )
    }

    if (filtroEstado) {
      result = result.filter((i) => i.estado_inventario === filtroEstado)
    }

    return result
  }, [items, search, filtroEstado])

  const estadoBadge = (estado: string | null) => {
    switch (estado) {
      case 'disponible':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
            <CircleCheck className="h-3 w-3" />
            Disponible
          </span>
        )
      case 'bajo_stock':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
            <AlertTriangle className="h-3 w-3" />
            Bajo stock
          </span>
        )
      case 'agotado':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
            <XCircle className="h-3 w-3" />
            Agotado
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
            {estado ?? '—'}
          </span>
        )
    }
  }

  const columns = [
    {
      key: 'codigo',
      header: 'Código',
      render: (i: InventarioView) => (
        <span className="font-medium text-gray-900">{i.codigo ?? '—'}</span>
      ),
    },
    {
      key: 'nombre',
      header: 'Producto',
      render: (i: InventarioView) => (
        <span className="font-medium text-gray-800">{i.nombre}</span>
      ),
    },
    {
      key: 'categoria_nombre',
      header: 'Categoría',
      render: (i: InventarioView) => (
        <span className="inline-block rounded-full bg-morado-50 px-3 py-1 text-xs font-medium text-morado-700">
          {i.categoria_nombre ?? '—'}
        </span>
      ),
    },
    {
      key: 'stock_actual',
      header: 'Stock actual',
      render: (i: InventarioView) => (
        <span className="font-semibold text-gray-800">{i.stock_actual}</span>
      ),
    },
    {
      key: 'stock_minimo',
      header: 'Stock mínimo',
      render: (i: InventarioView) => (
        <span className="text-gray-600">{i.stock_minimo}</span>
      ),
    },
    {
      key: 'estado_inventario',
      header: 'Estado',
      render: (i: InventarioView) => estadoBadge(i.estado_inventario),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      render: (i: InventarioView) => (
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => openEntrada(i)}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-green-50 hover:text-green-600"
            title="Registrar entrada"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => openAjuste(i)}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-fucsia-50 hover:text-fucsia-600"
            title="Ajustar stock"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => openMovimientos(i)}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
            title="Ver movimientos"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  const getUsuarioId = async (): Promise<string | null> => {
    const { data } = await supabase.auth.getUser()
    return data.user?.id ?? null
  }

  const getProductoById = async (id: string) => {
    const { data, error } = await supabase
      .from('productos')
      .select('id, stock_actual, stock_minimo')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error Supabase inventario:', JSON.stringify(error, null, 2))
      return null
    }
    return data
  }

  // --- Modal handlers ---

  const openEntrada = (item?: InventarioView) => {
    const product = item ?? items.find((i) => i.id === productoId)
    setSelected(product ?? null)
    setProductoId(product?.id ?? '')
    setCurrentStock(product?.stock_actual ?? 0)
    setEntradaCantidad('')
    setEntradaObservacion('')
    setModal('entrada')
  }

  const openAjuste = (item?: InventarioView) => {
    const product = item ?? items.find((i) => i.id === productoId)
    setSelected(product ?? null)
    setProductoId(product?.id ?? '')
    setCurrentStock(product?.stock_actual ?? 0)
    setAjusteNuevoStock(String(product?.stock_actual ?? 0))
    setAjusteObservacion('')
    setModal('ajuste')
  }

  const openSalida = (item?: InventarioView) => {
    const product = item ?? items.find((i) => i.id === productoId)
    setSelected(product ?? null)
    setProductoId(product?.id ?? '')
    setCurrentStock(product?.stock_actual ?? 0)
    setSalidaCantidad('')
    setSalidaObservacion('')
    setModal('salida')
  }

  const openMovimientos = async (item: InventarioView) => {
    setSelected(item)
    setMovimientosProducto(item.nombre)
    setMovimientosLoading(true)
    setModal('movimientos')

    const { data, error } = await supabase
      .from('movimientos_inventario')
      .select('*')
      .eq('producto_id', item.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error Supabase inventario:', JSON.stringify(error, null, 2))
      toast.error('Error al cargar movimientos')
    } else {
      setMovimientos(data ?? [])
    }
    setMovimientosLoading(false)
  }

  const onProductoChange = (id: string) => {
    setProductoId(id)
    const product = items.find((i) => i.id === id)
    if (product) {
      setSelected(product)
      setCurrentStock(product.stock_actual)
    }
  }

  // --- Stock operations ---

  const handleEntrada = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!productoId) {
      toast.error('Debes seleccionar un producto')
      return
    }
    const cantidad = Number(entradaCantidad)
    if (!cantidad || cantidad <= 0) {
      toast.error('La cantidad debe ser mayor a 0')
      return
    }

    setSaving(true)
    const usuario_id = await getUsuarioId()
    const prod = await getProductoById(productoId)
    if (!prod) {
      toast.error('Error al obtener datos del producto')
      setSaving(false)
      return
    }

    const stockAnterior = prod.stock_actual
    const stockNuevo = stockAnterior + cantidad
    const estado = stockNuevo > 0 ? 'disponible' : 'agotado'

    const movimientoPayload = {
      producto_id: productoId,
      usuario_id,
      tipo: 'entrada',
      cantidad,
      stock_anterior: stockAnterior,
      stock_nuevo: stockNuevo,
      referencia_tipo: 'inventario',
      referencia_id: null,
      observacion: entradaObservacion.trim() || null,
    }

    const { error: updateError } = await supabase
      .from('productos')
      .update({ stock_actual: stockNuevo, estado })
      .eq('id', productoId)

    if (updateError) {
      console.error('Error Supabase inventario:', JSON.stringify(updateError, null, 2))
      toast.error(updateError.message || 'Error al actualizar inventario')
      setSaving(false)
      return
    }

    const { error: insertError } = await supabase
      .from('movimientos_inventario')
      .insert(movimientoPayload)

    if (insertError) {
      console.error('Error Supabase inventario:', JSON.stringify(insertError, null, 2))
      toast.error(insertError.message || 'Movimiento registrado, error al guardar historial')
    } else {
      toast.success('Entrada registrada correctamente')
    }

    setSaving(false)
    setModal(null)
    fetchInventario()
  }

  const handleAjuste = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!productoId) {
      toast.error('Debes seleccionar un producto')
      return
    }
    const nuevoStock = Number(ajusteNuevoStock)
    if (nuevoStock < 0 || ajusteNuevoStock === '') {
      toast.error('El nuevo stock debe ser mayor o igual a 0')
      return
    }

    setSaving(true)
    const usuario_id = await getUsuarioId()
    const prod = await getProductoById(productoId)
    if (!prod) {
      toast.error('Error al obtener datos del producto')
      setSaving(false)
      return
    }

    if (nuevoStock === prod.stock_actual) {
      toast.error('El nuevo stock debe ser diferente al stock actual')
      setSaving(false)
      return
    }

    const stockAnterior = prod.stock_actual
    const cantidad = Math.abs(nuevoStock - stockAnterior)
    const estado = nuevoStock === 0 ? 'agotado' : 'disponible'

    const movimientoPayload = {
      producto_id: productoId,
      usuario_id,
      tipo: 'ajuste',
      cantidad,
      stock_anterior: stockAnterior,
      stock_nuevo: nuevoStock,
      referencia_tipo: 'inventario',
      referencia_id: null,
      observacion: ajusteObservacion.trim() || null,
    }

    const { error: updateError } = await supabase
      .from('productos')
      .update({ stock_actual: nuevoStock, estado })
      .eq('id', productoId)

    if (updateError) {
      console.error('Error Supabase inventario:', JSON.stringify(updateError, null, 2))
      toast.error(updateError.message || 'Error al actualizar inventario')
      setSaving(false)
      return
    }

    const { error: insertError } = await supabase
      .from('movimientos_inventario')
      .insert(movimientoPayload)

    if (insertError) {
      console.error('Error Supabase inventario:', JSON.stringify(insertError, null, 2))
      toast.error(insertError.message || 'Ajuste registrado, error al guardar historial')
    } else {
      toast.success('Ajuste registrado correctamente')
    }

    setSaving(false)
    setModal(null)
    fetchInventario()
  }

  const handleSalida = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!productoId) {
      toast.error('Debes seleccionar un producto')
      return
    }
    const cantidad = Number(salidaCantidad)
    if (!cantidad || cantidad <= 0) {
      toast.error('La cantidad debe ser mayor a 0')
      return
    }

    setSaving(true)
    const usuario_id = await getUsuarioId()
    const prod = await getProductoById(productoId)
    if (!prod) {
      toast.error('Error al obtener datos del producto')
      setSaving(false)
      return
    }

    if (cantidad > prod.stock_actual) {
      toast.error(`Stock insuficiente. Stock actual: ${prod.stock_actual}`)
      setSaving(false)
      return
    }

    const stockAnterior = prod.stock_actual
    const stockNuevo = stockAnterior - cantidad
    const estado = stockNuevo === 0 ? 'agotado' : 'disponible'

    const movimientoPayload = {
      producto_id: productoId,
      usuario_id,
      tipo: 'salida',
      cantidad,
      stock_anterior: stockAnterior,
      stock_nuevo: stockNuevo,
      referencia_tipo: 'inventario',
      referencia_id: null,
      observacion: salidaObservacion.trim() || null,
    }

    const { error: updateError } = await supabase
      .from('productos')
      .update({ stock_actual: stockNuevo, estado })
      .eq('id', productoId)

    if (updateError) {
      console.error('Error Supabase inventario:', JSON.stringify(updateError, null, 2))
      toast.error(updateError.message || 'Error al actualizar inventario')
      setSaving(false)
      return
    }

    const { error: insertError } = await supabase
      .from('movimientos_inventario')
      .insert(movimientoPayload)

    if (insertError) {
      console.error('Error Supabase inventario:', JSON.stringify(insertError, null, 2))
      toast.error(insertError.message || 'Salida registrada, error al guardar historial')
    } else {
      toast.success('Salida registrada correctamente')
    }

    setSaving(false)
    setModal(null)
    fetchInventario()
  }

  const tiposMovimiento: Record<string, { label: string; color: string }> = {
    entrada: { label: 'Entrada', color: 'text-green-600 bg-green-50' },
    salida: { label: 'Salida', color: 'text-red-600 bg-red-50' },
    ajuste: { label: 'Ajuste', color: 'text-fucsia-600 bg-fucsia-50' },
    venta: { label: 'Venta', color: 'text-blue-600 bg-blue-50' },
  }

  const formatFecha = (fecha: string) => {
    const d = new Date(fecha)
    return d.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Inventario</h1>
        <p className="mt-1 text-sm text-gray-500">
          Controla el stock actual, productos agotados y alertas de reposición.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Total productos</p>
              <p className="mt-1 text-2xl font-bold text-gray-800">{summary.total}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
              <Package className="h-5 w-5 text-gray-500" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Disponibles</p>
              <p className="mt-1 text-2xl font-bold text-green-600">{summary.disponibles}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
              <CircleCheck className="h-5 w-5 text-green-500" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Bajo stock</p>
              <p className="mt-1 text-2xl font-bold text-amber-600">{summary.bajoStock}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Agotados</p>
              <p className="mt-1 text-2xl font-bold text-red-600">{summary.agotados}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por código, producto o categoría..."
        />
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
        >
          <option value="">Todos los estados</option>
          <option value="disponible">Disponible</option>
          <option value="bajo_stock">Bajo stock</option>
          <option value="agotado">Agotado</option>
        </select>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => openEntrada()}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            <ArrowDown className="h-4 w-4 text-green-500" />
            Entrada
          </button>
          <button
            type="button"
            onClick={() => openSalida()}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            <ArrowUp className="h-4 w-4 text-red-500" />
            Salida
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        emptyMessage={
          search || filtroEstado
            ? 'No se encontraron productos con los filtros aplicados.'
            : 'No hay productos en el inventario.'
        }
        keyExtractor={(i) => i.id}
      />

      {/* Entrada Modal */}
      <FormModal isOpen={modal === 'entrada'} onClose={() => setModal(null)} title="Registrar entrada">
        <form onSubmit={handleEntrada} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Producto *</label>
            <select
              value={productoId}
              onChange={(e) => onProductoChange(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
            >
              <option value="">Seleccionar producto</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.codigo ? `${i.codigo} — ` : ''}{i.nombre}
                </option>
              ))}
            </select>
          </div>

          {selected && (
            <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm">
              <span className="text-gray-500">Stock actual: </span>
              <span className="font-semibold text-gray-800">{currentStock}</span>
              <span className="mx-2 text-gray-300">|</span>
              <span className="text-gray-500">Stock mínimo: </span>
              <span className="font-semibold text-gray-800">{selected.stock_minimo}</span>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Cantidad a ingresar *</label>
            <input
              type="number"
              min="1"
              value={entradaCantidad}
              onChange={(e) => setEntradaCantidad(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
              placeholder="0"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Observación</label>
            <input
              type="text"
              value={entradaObservacion}
              onChange={(e) => setEntradaObservacion(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
              placeholder="Observación opcional"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={() => setModal(null)}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-fucsia-500 to-morado-600 px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-fucsia-200 transition-all hover:from-fucsia-600 hover:to-morado-700 disabled:opacity-60"
            >
              {saving ? 'Guardando...' : 'Registrar entrada'}
            </button>
          </div>
        </form>
      </FormModal>

      {/* Ajuste Modal */}
      <FormModal isOpen={modal === 'ajuste'} onClose={() => setModal(null)} title="Ajustar stock">
        <form onSubmit={handleAjuste} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Producto *</label>
            <select
              value={productoId}
              onChange={(e) => onProductoChange(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
            >
              <option value="">Seleccionar producto</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.codigo ? `${i.codigo} — ` : ''}{i.nombre}
                </option>
              ))}
            </select>
          </div>

          {selected && (
            <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm">
              <span className="text-gray-500">Stock actual: </span>
              <span className="font-semibold text-gray-800">{currentStock}</span>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nuevo stock *</label>
            <input
              type="number"
              min="0"
              value={ajusteNuevoStock}
              onChange={(e) => setAjusteNuevoStock(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
              placeholder="0"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Observación</label>
            <input
              type="text"
              value={ajusteObservacion}
              onChange={(e) => setAjusteObservacion(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
              placeholder="Motivo del ajuste"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={() => setModal(null)}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-fucsia-500 to-morado-600 px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-fucsia-200 transition-all hover:from-fucsia-600 hover:to-morado-700 disabled:opacity-60"
            >
              {saving ? 'Guardando...' : 'Ajustar stock'}
            </button>
          </div>
        </form>
      </FormModal>

      {/* Salida Modal */}
      <FormModal isOpen={modal === 'salida'} onClose={() => setModal(null)} title="Registrar salida">
        <form onSubmit={handleSalida} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Producto *</label>
            <select
              value={productoId}
              onChange={(e) => onProductoChange(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
            >
              <option value="">Seleccionar producto</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.codigo ? `${i.codigo} — ` : ''}{i.nombre}
                </option>
              ))}
            </select>
          </div>

          {selected && (
            <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm">
              <span className="text-gray-500">Stock actual: </span>
              <span className="font-semibold text-gray-800">{currentStock}</span>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Cantidad a retirar *</label>
            <input
              type="number"
              min="1"
              value={salidaCantidad}
              onChange={(e) => setSalidaCantidad(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
              placeholder="0"
            />
            {selected && Number(salidaCantidad) > currentStock && (
              <p className="mt-1 text-xs text-red-500">
                Stock insuficiente. Stock actual: {currentStock}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Observación</label>
            <input
              type="text"
              value={salidaObservacion}
              onChange={(e) => setSalidaObservacion(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
              placeholder="Motivo de la salida"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={() => setModal(null)}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-fucsia-500 to-morado-600 px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-fucsia-200 transition-all hover:from-fucsia-600 hover:to-morado-700 disabled:opacity-60"
            >
              {saving ? 'Guardando...' : 'Registrar salida'}
            </button>
          </div>
        </form>
      </FormModal>

      {/* Movimientos Modal */}
      <FormModal
        isOpen={modal === 'movimientos'}
        onClose={() => setModal(null)}
        title={`Movimientos — ${movimientosProducto}`}
        size="lg"
      >
        {movimientosLoading ? (
          <p className="py-8 text-center text-sm text-gray-400">Cargando movimientos...</p>
        ) : movimientos.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            No hay movimientos registrados para este producto.
          </p>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2 text-right">Cantidad</th>
                  <th className="px-3 py-2 text-right">Stock anterior</th>
                  <th className="px-3 py-2 text-right">Stock nuevo</th>
                  <th className="px-3 py-2">Observación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {movimientos.map((m) => {
                  const tipo = tiposMovimiento[m.tipo] ?? { label: m.tipo, color: 'text-gray-600 bg-gray-50' }
                  return (
                    <tr key={m.id} className="transition-colors hover:bg-gray-50/50">
                      <td className="whitespace-nowrap px-3 py-2.5 text-gray-600">
                        {formatFecha(m.created_at)}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${tipo.color}`}>
                          {tipo.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right font-medium text-gray-800">
                        {m.cantidad}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right text-gray-600">
                        {m.stock_anterior ?? '—'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right font-medium text-gray-800">
                        {m.stock_nuevo ?? '—'}
                      </td>
                      <td className="max-w-[160px] truncate px-3 py-2.5 text-gray-500">
                        {m.observacion ?? '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </FormModal>
    </motion.div>
  )
}
