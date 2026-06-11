import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabaseClient'
import { PedidoPersonalizadoView, Cliente, PagoPedido } from '../types/database'
import toast from 'react-hot-toast'
import {
  Plus,
  Pencil,
  Eye,
  XCircle,
  DollarSign,
} from 'lucide-react'
import DataTable from '../components/DataTable'
import FormModal from '../components/FormModal'
import ConfirmDialog from '../components/ConfirmDialog'
import SearchInput from '../components/SearchInput'

const estadosValidos = ['pendiente', 'en_proceso', 'listo', 'entregado', 'cancelado'] as const

const estadoConfig: Record<string, { label: string; color: string }> = {
  pendiente: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700' },
  en_proceso: { label: 'En proceso', color: 'bg-blue-100 text-blue-700' },
  listo: { label: 'Listo', color: 'bg-green-100 text-green-700' },
  entregado: { label: 'Entregado', color: 'bg-emerald-100 text-emerald-700' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
}

const metodosPago = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'yape', label: 'Yape' },
  { value: 'plin', label: 'Plin' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'otro', label: 'Otro' },
] as const

export default function PedidosPersonalizados() {
  const [pedidos, setPedidos] = useState<PedidoPersonalizadoView[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  // --- Create / Edit modal ---
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [formClienteId, setFormClienteId] = useState('')
  const [formTipo, setFormTipo] = useState('')
  const [formDescripcion, setFormDescripcion] = useState('')
  const [formFechaEntrega, setFormFechaEntrega] = useState('')
  const [formTotal, setFormTotal] = useState('')
  const [formAdelanto, setFormAdelanto] = useState('')
  const [formMetodoPagoAdelanto, setFormMetodoPagoAdelanto] = useState('')
  const [formEstado, setFormEstado] = useState('pendiente')
  const [formObservaciones, setFormObservaciones] = useState('')

  // --- Pago modal ---
  const [pagoOpen, setPagoOpen] = useState(false)
  const [pagoPedido, setPagoPedido] = useState<PedidoPersonalizadoView | null>(null)
  const [pagoMonto, setPagoMonto] = useState('')
  const [pagoMetodo, setPagoMetodo] = useState('')
  const [pagoObservacion, setPagoObservacion] = useState('')
  const [pagoSaving, setPagoSaving] = useState(false)

  // --- Detail modal ---
  const [detalleOpen, setDetalleOpen] = useState(false)
  const [detalleTarget, setDetalleTarget] = useState<PedidoPersonalizadoView | null>(null)
  const [detallePagos, setDetallePagos] = useState<PagoPedido[]>([])
  const [detalleLoading, setDetalleLoading] = useState(false)

  // --- Estado change confirmation ---
  const [estadoChangeTarget, setEstadoChangeTarget] = useState<{
    pedido: PedidoPersonalizadoView
    nuevoEstado: string
  } | null>(null)
  const [estadoChangeLoading, setEstadoChangeLoading] = useState(false)

  // --- Cancel confirmation ---
  const [cancelTarget, setCancelTarget] = useState<PedidoPersonalizadoView | null>(null)
  const [cancelLoading, setCancelLoading] = useState(false)

  useEffect(() => {
    fetchData()
    fetchClientes()
  }, [])

  // ========== DATA ==========

  const fetchData = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('vw_pedidos_personalizados')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Error al cargar pedidos')
      console.error('Error Supabase pedidos:', JSON.stringify(error, null, 2))
    } else {
      setPedidos(data ?? [])
    }
    setLoading(false)
  }

  const fetchClientes = async () => {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('activo', true)
      .order('nombre')

    if (!error) setClientes(data ?? [])
  }

  // ========== COMPUTED ==========

  const filtered = useMemo(() => {
    let result = [...pedidos]
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (p) =>
          (p.codigo_pedido ?? '').toLowerCase().includes(q) ||
          (p.cliente_nombre ?? '').toLowerCase().includes(q) ||
          (p.cliente_telefono ?? '').toLowerCase().includes(q) ||
          (p.tipo_pedido ?? '').toLowerCase().includes(q) ||
          p.descripcion.toLowerCase().includes(q),
      )
    }
    if (filtroEstado) result = result.filter((p) => p.estado === filtroEstado)
    return result
  }, [pedidos, search, filtroEstado])

  const summary = useMemo(() => {
    const pendientes = pedidos.filter((p) => p.estado === 'pendiente').length
    const enProceso = pedidos.filter((p) => p.estado === 'en_proceso').length
    const listos = pedidos.filter((p) => p.estado === 'listo').length
    const entregados = pedidos.filter((p) => p.estado === 'entregado').length
    const saldoTotal = pedidos.reduce((s, p) => s + (p.saldo ?? 0), 0)
    return { pendientes, enProceso, listos, entregados, saldoTotal }
  }, [pedidos])

  // ========== FORM HELPERS ==========

  const resetForm = () => {
    setFormClienteId('')
    setFormTipo('')
    setFormDescripcion('')
    setFormFechaEntrega('')
    setFormTotal('')
    setFormAdelanto('')
    setFormMetodoPagoAdelanto('')
    setFormEstado('pendiente')
    setFormObservaciones('')
  }

  const generateCodigo = () => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    const h = String(now.getHours()).padStart(2, '0')
    const min = String(now.getMinutes()).padStart(2, '0')
    const s = String(now.getSeconds()).padStart(2, '0')
    return `PED-${y}${m}${d}-${h}${min}${s}`
  }

  const openCreate = () => {
    setEditingId(null)
    resetForm()
    setFormOpen(true)
  }

  const openEdit = async (pedido: PedidoPersonalizadoView) => {
    setEditingId(pedido.id)
    setFormClienteId('')

    const { data, error } = await supabase
      .from('pedidos_personalizados')
      .select('*')
      .eq('id', pedido.id)
      .single()

    if (error) {
      console.error('Error Supabase pedidos:', JSON.stringify(error, null, 2))
      toast.error('Error al cargar datos del pedido')
      return
    }

    setFormClienteId(data.cliente_id)
    setFormTipo(data.tipo_pedido ?? '')
    setFormDescripcion(data.descripcion)
    setFormFechaEntrega(data.fecha_entrega ? data.fecha_entrega.slice(0, 10) : '')
    setFormTotal(String(data.total))
    setFormAdelanto('0')
    setFormMetodoPagoAdelanto('')
    setFormEstado(data.estado ?? 'pendiente')
    setFormObservaciones(data.observaciones ?? '')
    setFormOpen(true)
  }

  // ========== CREATE / EDIT ==========

  const validateForm = (): boolean => {
    if (!formClienteId) { toast.error('Selecciona un cliente'); return false }
    if (!formTipo.trim()) { toast.error('El tipo de pedido es obligatorio'); return false }
    if (!formDescripcion.trim()) { toast.error('La descripción es obligatoria'); return false }
    if (!formFechaEntrega) { toast.error('La fecha de entrega es obligatoria'); return false }
    const total = Number(formTotal)
    if (total <= 0) { toast.error('El total debe ser mayor a 0'); return false }
    const adelanto = Number(formAdelanto) || 0
    if (adelanto < 0) { toast.error('El adelanto no puede ser negativo'); return false }
    if (adelanto > total) { toast.error('El adelanto no puede superar el total'); return false }
    if (adelanto > 0 && !formMetodoPagoAdelanto) {
      toast.error('Selecciona el método de pago del adelanto')
      return false
    }
    if (editingId && !estadosValidos.includes(formEstado as typeof estadosValidos[number])) {
      toast.error('Estado no válido'); return false
    }
    return true
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setSaving(true)

    const isEdit = !!editingId

    if (isEdit) {
      const { error } = await supabase
        .from('pedidos_personalizados')
        .update({
          cliente_id: formClienteId,
          tipo_pedido: formTipo.trim(),
          descripcion: formDescripcion.trim(),
          fecha_entrega: formFechaEntrega,
          total: Number(formTotal),
          estado: formEstado,
          observaciones: formObservaciones.trim() || null,
        })
        .eq('id', editingId)

      if (error) {
        console.error('Error Supabase pedidos:', JSON.stringify(error, null, 2))
        toast.error(error.message || 'Error al actualizar pedido')
      } else {
        toast.success('Pedido actualizado correctamente')
        setFormOpen(false)
        fetchData()
      }
      setSaving(false)
      return
    }

    // Create
    const codigo = generateCodigo()
    const adelanto = Number(formAdelanto) || 0

    const pedidoPayload = {
      cliente_id: formClienteId,
      codigo_pedido: codigo,
      tipo_pedido: formTipo.trim(),
      descripcion: formDescripcion.trim(),
      fecha_entrega: formFechaEntrega,
      total: Number(formTotal),
      adelanto: 0,
      estado: 'pendiente',
      observaciones: formObservaciones.trim() || null,
    }

    console.log('Payload pedido:', pedidoPayload)

    const { data: insertData, error: insertError } = await supabase
      .from('pedidos_personalizados')
      .insert(pedidoPayload)
      .select('id')
      .single()

    if (insertError) {
      console.error('Error Supabase pedidos:', JSON.stringify(insertError, null, 2))
      toast.error(insertError.message || 'Error al guardar pedido')
      setSaving(false)
      return
    }

    if (adelanto > 0) {
      const pagoPayload = {
        pedido_id: insertData.id,
        monto: adelanto,
        metodo_pago: formMetodoPagoAdelanto,
        observacion: 'Adelanto inicial del pedido',
      }

      console.log('Payload pago:', pagoPayload)

      const { error: pagoError } = await supabase
        .from('pagos_pedido')
        .insert(pagoPayload)

      if (pagoError) {
        console.error('Error Supabase pedidos:', JSON.stringify(pagoError, null, 2))
        toast.error(pagoError.message || 'Pedido creado, pero error al registrar adelanto')
      }
    }

    toast.success('Pedido registrado correctamente')
    setFormOpen(false)
    fetchData()
    setSaving(false)
  }

  // ========== PAGO ==========

  const openPago = (pedido: PedidoPersonalizadoView) => {
    setPagoPedido(pedido)
    setPagoMonto('')
    setPagoMetodo('')
    setPagoObservacion('')
    setPagoOpen(true)
  }

  const handlePago = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pagoPedido) return

    const monto = Number(pagoMonto)
    if (monto <= 0) { toast.error('El monto debe ser mayor a 0'); return }
    if (monto > (pagoPedido.saldo ?? 0)) {
      toast.error('El monto supera el saldo pendiente'); return
    }
    if (!pagoMetodo) { toast.error('Selecciona un método de pago'); return }

    setPagoSaving(true)

    const pagoPayload = {
      pedido_id: pagoPedido.id,
      monto,
      metodo_pago: pagoMetodo,
      observacion: pagoObservacion.trim() || null,
    }

    console.log('Payload pago:', pagoPayload)

    const { error } = await supabase.from('pagos_pedido').insert(pagoPayload)

    if (error) {
      console.error('Error Supabase pedidos:', JSON.stringify(error, null, 2))
      toast.error(error.message || 'Error al registrar pago')
    } else {
      toast.success('Pago registrado correctamente')
      setPagoOpen(false)
      fetchData()
    }
    setPagoSaving(false)
  }

  // ========== ESTADO CHANGE ==========

  const handleEstadoChange = async () => {
    if (!estadoChangeTarget) return
    setEstadoChangeLoading(true)

    const { error } = await supabase
      .from('pedidos_personalizados')
      .update({ estado: estadoChangeTarget.nuevoEstado })
      .eq('id', estadoChangeTarget.pedido.id)

    if (error) {
      console.error('Error Supabase pedidos:', JSON.stringify(error, null, 2))
      toast.error(error.message || 'Error al actualizar estado')
    } else {
      toast.success('Estado actualizado correctamente')
      setEstadoChangeTarget(null)
      fetchData()
    }
    setEstadoChangeLoading(false)
  }

  // ========== CANCEL ==========

  const handleCancel = async () => {
    if (!cancelTarget) return
    setCancelLoading(true)

    const { error } = await supabase
      .from('pedidos_personalizados')
      .update({ estado: 'cancelado' })
      .eq('id', cancelTarget.id)

    if (error) {
      console.error('Error Supabase pedidos:', JSON.stringify(error, null, 2))
      toast.error(error.message || 'Error al cancelar pedido')
    } else {
      toast.success('Pedido cancelado correctamente')
      setCancelTarget(null)
      fetchData()
    }
    setCancelLoading(false)
  }

  // ========== DETALLE ==========

  const openDetalle = async (pedido: PedidoPersonalizadoView) => {
    setDetalleTarget(pedido)
    setDetalleLoading(true)
    setDetalleOpen(true)

    const { data, error } = await supabase
      .from('pagos_pedido')
      .select('*')
      .eq('pedido_id', pedido.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error Supabase pedidos:', JSON.stringify(error, null, 2))
    }
    setDetallePagos(data ?? [])
    setDetalleLoading(false)
  }

  // ========== HELPERS ==========

  const formatCurrency = (v: number | null) => {
    if (v === null || v === undefined) return '—'
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v)
  }

  const formatDate = (f: string | null) => {
    if (!f) return '—'
    return new Date(f).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const formatDateTime = (f: string | null) => {
    if (!f) return '—'
    return new Date(f).toLocaleDateString('es-MX', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }

  const EstadoBadge = ({ estado }: { estado: string | null }) => {
    const cfg = estadoConfig[estado ?? ''] ?? { label: estado ?? '—', color: 'bg-gray-100 text-gray-600' }
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}>
        {cfg.label}
      </span>
    )
  }

  // ========== COLUMNS ==========

  const columns = [
    {
      key: 'codigo_pedido',
      header: 'Código',
      render: (p: PedidoPersonalizadoView) => (
        <span className="font-medium text-gray-900">{p.codigo_pedido ?? '—'}</span>
      ),
    },
    {
      key: 'cliente_nombre',
      header: 'Cliente',
      render: (p: PedidoPersonalizadoView) => (
        <div>
          <p className="font-medium text-gray-800">{p.cliente_nombre ?? '—'}</p>
          {p.cliente_telefono && <p className="text-xs text-gray-400">{p.cliente_telefono}</p>}
        </div>
      ),
    },
    {
      key: 'tipo_pedido',
      header: 'Tipo',
      render: (p: PedidoPersonalizadoView) => (
        <span className="text-gray-600">{p.tipo_pedido ?? '—'}</span>
      ),
    },
    {
      key: 'fecha_entrega',
      header: 'Entrega',
      render: (p: PedidoPersonalizadoView) => (
        <span className="text-gray-600">{formatDate(p.fecha_entrega)}</span>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      render: (p: PedidoPersonalizadoView) => (
        <span className="font-semibold text-gray-800">{formatCurrency(p.total)}</span>
      ),
    },
    {
      key: 'adelanto',
      header: 'Adelanto',
      render: (p: PedidoPersonalizadoView) => (
        <span className="text-gray-600">{formatCurrency(p.adelanto)}</span>
      ),
    },
    {
      key: 'saldo',
      header: 'Saldo',
      render: (p: PedidoPersonalizadoView) => {
        const saldo = p.saldo ?? p.total - p.adelanto
        return (
          <span className={`font-semibold ${saldo > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(saldo)}
          </span>
        )
      },
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (p: PedidoPersonalizadoView) => <EstadoBadge estado={p.estado} />,
    },
    {
      key: 'acciones',
      header: 'Acciones',
      render: (p: PedidoPersonalizadoView) => (
        <div className="flex gap-1">
          <button type="button" onClick={() => openDetalle(p)} className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600" title="Ver detalle">
            <Eye className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => openEdit(p)} className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-fucsia-50 hover:text-fucsia-600" title="Editar">
            <Pencil className="h-4 w-4" />
          </button>
          {p.estado !== 'cancelado' && p.estado !== 'entregado' && (
            <button type="button" onClick={() => openPago(p)} className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-green-50 hover:text-green-600" title="Registrar pago">
              <DollarSign className="h-4 w-4" />
            </button>
          )}
          {p.estado !== 'cancelado' && p.estado !== 'entregado' && (
            <button type="button" onClick={() => setCancelTarget(p)} className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600" title="Cancelar pedido">
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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pedidos personalizados</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona pedidos especiales, fechas de entrega, adelantos y saldos pendientes.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-fucsia-500 to-morado-600 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-fucsia-200 transition-all hover:from-fucsia-600 hover:to-morado-700"
        >
          <Plus className="h-4 w-4" />
          Nuevo pedido
        </button>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {[
          { label: 'Pendientes', value: summary.pendientes, color: 'text-amber-600' },
          { label: 'En proceso', value: summary.enProceso, color: 'text-blue-600' },
          { label: 'Listos', value: summary.listos, color: 'text-green-600' },
          { label: 'Entregados', value: summary.entregados, color: 'text-emerald-600' },
          { label: 'Saldo pendiente', value: formatCurrency(summary.saldoTotal), color: 'text-red-600', large: true },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{card.label}</p>
            <p className={`mt-1 text-2xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Search & filter */}
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por código, cliente, teléfono, tipo o descripción..."
        />
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
        >
          <option value="">Todos los estados</option>
          {estadosValidos.map((est) => (
            <option key={est} value={est}>{estadoConfig[est].label}</option>
          ))}
        </select>
        <div />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        emptyMessage={search || filtroEstado ? 'No se encontraron pedidos con los filtros aplicados.' : 'No hay pedidos personalizados registrados.'}
        keyExtractor={(p) => p.id}
      />

      {/* ========== CREATE / EDIT MODAL ========== */}
      <FormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? 'Editar pedido' : 'Nuevo pedido personalizado'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Cliente *</label>
              <select
                value={formClienteId}
                onChange={(e) => setFormClienteId(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
              >
                <option value="">Seleccionar cliente</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}{c.telefono ? ` — ${c.telefono}` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Tipo de pedido *</label>
              <input
                type="text"
                value={formTipo}
                onChange={(e) => setFormTipo(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
                placeholder="Ej: Piñata, Decoración, Pastel"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Descripción *</label>
            <textarea
              value={formDescripcion}
              onChange={(e) => setFormDescripcion(e.target.value)}
              required
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
              placeholder="Describe el pedido personalizado"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Fecha de entrega *</label>
              <input
                type="date"
                value={formFechaEntrega}
                onChange={(e) => setFormFechaEntrega(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Total *</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={formTotal}
                onChange={(e) => setFormTotal(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
                placeholder="0.00"
              />
            </div>
            {!editingId && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Adelanto inicial</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formAdelanto}
                  onChange={(e) => setFormAdelanto(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
                  placeholder="0.00"
                />
              </div>
            )}
          </div>

          {!editingId && Number(formAdelanto) > 0 && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Método de pago del adelanto *</label>
              <select
                value={formMetodoPagoAdelanto}
                onChange={(e) => setFormMetodoPagoAdelanto(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
              >
                <option value="">Seleccionar método</option>
                {metodosPago.map((mp) => (
                  <option key={mp.value} value={mp.value}>{mp.label}</option>
                ))}
              </select>
            </div>
          )}

          {editingId && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Estado</label>
              <select
                value={formEstado}
                onChange={(e) => setFormEstado(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
              >
                {estadosValidos.map((est) => (
                  <option key={est} value={est}>{estadoConfig[est].label}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Observaciones</label>
            <textarea
              value={formObservaciones}
              onChange={(e) => setFormObservaciones(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
              placeholder="Observaciones opcionales"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button type="button" onClick={() => setFormOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-gradient-to-r from-fucsia-500 to-morado-600 px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-fucsia-200 transition-all hover:from-fucsia-600 hover:to-morado-700 disabled:opacity-60"
            >
              {saving ? 'Guardando...' : editingId ? 'Actualizar pedido' : 'Registrar pedido'}
            </button>
          </div>
        </form>
      </FormModal>

      {/* ========== PAGO MODAL ========== */}
      <FormModal isOpen={pagoOpen} onClose={() => setPagoOpen(false)} title="Registrar pago" size="sm">
        <form onSubmit={handlePago} className="space-y-4">
          {pagoPedido && (
            <div className="rounded-lg bg-gray-50 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Total:</span>
                <span className="font-semibold text-gray-800">{formatCurrency(pagoPedido.total)}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-500">Adelanto actual:</span>
                <span className="font-semibold text-gray-800">{formatCurrency(pagoPedido.adelanto)}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-500">Saldo pendiente:</span>
                <span className="font-semibold text-red-600">{formatCurrency(pagoPedido.saldo ?? pagoPedido.total - pagoPedido.adelanto)}</span>
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Monto a pagar *</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={pagoMonto}
              onChange={(e) => setPagoMonto(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Método de pago *</label>
            <select
              value={pagoMetodo}
              onChange={(e) => setPagoMetodo(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
            >
              <option value="">Seleccionar método</option>
              {metodosPago.map((mp) => (
                <option key={mp.value} value={mp.value}>{mp.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Observación</label>
            <input
              type="text"
              value={pagoObservacion}
              onChange={(e) => setPagoObservacion(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
              placeholder="Opcional"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button type="button" onClick={() => setPagoOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pagoSaving}
              className="rounded-lg bg-gradient-to-r from-fucsia-500 to-morado-600 px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-fucsia-200 transition-all hover:from-fucsia-600 hover:to-morado-700 disabled:opacity-60"
            >
              {pagoSaving ? 'Guardando...' : 'Registrar pago'}
            </button>
          </div>
        </form>
      </FormModal>

      {/* ========== DETALLE MODAL ========== */}
      <FormModal
        isOpen={detalleOpen}
        onClose={() => setDetalleOpen(false)}
        title={`Pedido — ${detalleTarget?.codigo_pedido ?? ''}`}
        size="lg"
      >
        {detalleLoading ? (
          <p className="py-8 text-center text-sm text-gray-400">Cargando detalle...</p>
        ) : detalleTarget ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Cliente</p>
                <p className="mt-1 font-medium text-gray-800">{detalleTarget.cliente_nombre ?? '—'}</p>
                {detalleTarget.cliente_telefono && (
                  <p className="text-xs text-gray-400">{detalleTarget.cliente_telefono}</p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Código</p>
                <p className="mt-1 font-medium text-gray-800">{detalleTarget.codigo_pedido ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Tipo de pedido</p>
                <p className="mt-1 text-gray-600">{detalleTarget.tipo_pedido ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Fecha de entrega</p>
                <p className="mt-1 text-gray-600">{formatDate(detalleTarget.fecha_entrega)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Estado</p>
                <p className="mt-1"><EstadoBadge estado={detalleTarget.estado} /></p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Descripción</p>
              <p className="mt-1 text-sm text-gray-600">{detalleTarget.descripcion}</p>
            </div>

            {detalleTarget.observaciones && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Observaciones</p>
                <p className="mt-1 text-sm text-gray-600">{detalleTarget.observaciones}</p>
              </div>
            )}

            <div className="border-t border-gray-100 pt-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">Resumen financiero</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Total', value: formatCurrency(detalleTarget.total), color: 'text-gray-800' },
                  { label: 'Adelanto', value: formatCurrency(detalleTarget.adelanto), color: 'text-blue-600' },
                  {
                    label: 'Saldo',
                    value: formatCurrency(detalleTarget.saldo ?? detalleTarget.total - detalleTarget.adelanto),
                    color: 'text-red-600',
                  },
                ].map((r) => (
                  <div key={r.label} className="rounded-lg bg-gray-50 p-3 text-center">
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{r.label}</p>
                    <p className={`mt-1 text-lg font-bold ${r.color}`}>{r.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">Historial de pagos</h3>
              {detallePagos.length === 0 ? (
                <p className="text-sm text-gray-400">No hay pagos registrados.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <th className="px-3 py-2">Fecha</th>
                      <th className="px-3 py-2">Monto</th>
                      <th className="px-3 py-2">Método</th>
                      <th className="px-3 py-2">Observación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {detallePagos.map((p) => (
                      <tr key={p.id} className="transition-colors hover:bg-gray-50/50">
                        <td className="whitespace-nowrap px-3 py-2.5 text-gray-600">
                          {formatDateTime(p.created_at)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 font-medium text-gray-800">
                          {formatCurrency(p.monto)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-gray-600">
                          {metodosPago.find((m) => m.value === p.metodo_pago)?.label ?? p.metodo_pago ?? '—'}
                        </td>
                        <td className="px-3 py-2.5 text-gray-500">
                          {p.observacion ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* State change buttons */}
            {detalleTarget.estado !== 'cancelado' && (
              <div className="border-t border-gray-100 pt-4">
                <h3 className="mb-3 text-sm font-semibold text-gray-700">Cambiar estado</h3>
                <div className="flex flex-wrap gap-2">
                  {estadosValidos
                    .filter((est) => est !== detalleTarget.estado && est !== 'cancelado')
                    .map((est) => (
                      <button
                        key={est}
                        type="button"
                        onClick={() => {
                          setDetalleOpen(false)
                          setEstadoChangeTarget({ pedido: detalleTarget, nuevoEstado: est })
                        }}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${estadoConfig[est].color} hover:opacity-80`}
                      >
                        {estadoConfig[est].label}
                      </button>
                    ))}
                  <button
                    type="button"
                    onClick={() => {
                      setDetalleOpen(false)
                      setCancelTarget(detalleTarget)
                    }}
                    className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:opacity-80"
                  >
                    Cancelar pedido
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </FormModal>

      {/* ========== ESTADO CHANGE CONFIRM ========== */}
      <ConfirmDialog
        isOpen={!!estadoChangeTarget}
        onClose={() => setEstadoChangeTarget(null)}
        onConfirm={handleEstadoChange}
        title="Cambiar estado"
        message={`¿Estás seguro de marcar el pedido "${estadoChangeTarget?.pedido.codigo_pedido}" como "${estadoChangeTarget ? estadoConfig[estadoChangeTarget.nuevoEstado]?.label : ''}"?`}
        confirmText="Cambiar estado"
        loading={estadoChangeLoading}
      />

      {/* ========== CANCEL CONFIRM ========== */}
      <ConfirmDialog
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        title="Cancelar pedido"
        message={`¿Estás seguro de cancelar el pedido "${cancelTarget?.codigo_pedido}"? No se eliminará el registro.`}
        confirmText="Cancelar pedido"
        loading={cancelLoading}
      />
    </motion.div>
  )
}
