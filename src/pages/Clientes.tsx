import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabaseClient'
import { ClienteFrecuenteView } from '../types/database'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Eye, CircleCheck, XCircle } from 'lucide-react'
import DataTable from '../components/DataTable'
import FormModal from '../components/FormModal'
import ConfirmDialog from '../components/ConfirmDialog'
import SearchInput from '../components/SearchInput'

type FilterEstado = 'todos' | 'activos' | 'inactivos'

export default function Clientes() {
  const [clientes, setClientes] = useState<ClienteFrecuenteView[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<FilterEstado>('activos')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<ClienteFrecuenteView | null>(null)
  const [saving, setSaving] = useState(false)

  const [detailTarget, setDetailTarget] = useState<ClienteFrecuenteView | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ClienteFrecuenteView | null>(null)

  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [direccion, setDireccion] = useState('')
  const [observaciones, setObservaciones] = useState('')

  useEffect(() => {
    fetchClientes()
  }, [])

  const fetchClientes = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('vw_clientes_frecuentes')
      .select('*')
      .order('nombre', { ascending: true })

    if (error) {
      toast.error('Error al cargar clientes')
      console.error('Error Supabase clientes:', JSON.stringify(error, null, 2))
    } else {
      setClientes(data ?? [])
    }
    setLoading(false)
  }

  const filtered = useMemo(() => {
    let result = [...clientes]

    if (filtroEstado === 'activos') {
      result = result.filter((c) => c.activo)
    } else if (filtroEstado === 'inactivos') {
      result = result.filter((c) => !c.activo)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (c) =>
          c.nombre.toLowerCase().includes(q) ||
          (c.telefono ?? '').toLowerCase().includes(q) ||
          (c.email ?? '').toLowerCase().includes(q) ||
          (c.direccion ?? '').toLowerCase().includes(q),
      )
    }

    return result
  }, [clientes, search, filtroEstado])

  const resetForm = () => {
    setNombre('')
    setTelefono('')
    setEmail('')
    setDireccion('')
    setObservaciones('')
  }

  const openCreate = () => {
    setEditingCliente(null)
    resetForm()
    setModalOpen(true)
  }

  const openEdit = async (cliente: ClienteFrecuenteView) => {
    setEditingCliente(cliente)

    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', cliente.id)
      .single()

    if (error) {
      console.error('Error Supabase clientes:', JSON.stringify(error, null, 2))
      setNombre(cliente.nombre)
      setTelefono(cliente.telefono ?? '')
      setEmail(cliente.email ?? '')
      setDireccion(cliente.direccion ?? '')
      setObservaciones('')
    } else {
      setNombre(data.nombre)
      setTelefono(data.telefono ?? '')
      setEmail(data.email ?? '')
      setDireccion(data.direccion ?? '')
      setObservaciones(data.observaciones ?? '')
    }

    setModalOpen(true)
  }

  const validateForm = (): boolean => {
    if (!nombre.trim()) {
      toast.error('El nombre del cliente es obligatorio')
      return false
    }
    if (telefono.trim() && telefono.trim().length < 6) {
      toast.error('El teléfono debe tener al menos 6 caracteres')
      return false
    }
    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        toast.error('El formato del correo electrónico no es válido')
        return false
      }
    }
    return true
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setSaving(true)

    const clientePayload = {
      nombre: nombre.trim(),
      telefono: telefono.trim() || null,
      email: email.trim() || null,
      direccion: direccion.trim() || null,
      observaciones: observaciones.trim() || null,
    }

    console.log('Payload cliente:', clientePayload)

    if (editingCliente) {
      const { error } = await supabase
        .from('clientes')
        .update(clientePayload)
        .eq('id', editingCliente.id)

      if (error) {
        console.error('Error Supabase clientes:', JSON.stringify(error, null, 2))
        toast.error(error.message || 'Error al actualizar cliente')
      } else {
        toast.success('Cliente actualizado correctamente')
        setModalOpen(false)
        fetchClientes()
      }
    } else {
      const { error } = await supabase
        .from('clientes')
        .insert({ ...clientePayload, activo: true })

      if (error) {
        console.error('Error Supabase clientes:', JSON.stringify(error, null, 2))
        toast.error(error.message || 'Error al guardar cliente')
      } else {
        toast.success('Cliente registrado correctamente')
        setModalOpen(false)
        fetchClientes()
      }
    }

    setSaving(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    const { error } = await supabase
      .from('clientes')
      .update({ activo: false })
      .eq('id', deleteTarget.id)

    if (error) {
      console.error('Error Supabase clientes:', JSON.stringify(error, null, 2))
      toast.error(error.message || 'Error al desactivar cliente')
    } else {
      toast.success('Cliente desactivado correctamente')
      setDeleteTarget(null)
      fetchClientes()
    }
  }

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '—'
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value)
  }

  const formatDate = (fecha: string | null) => {
    if (!fecha) return '—'
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const columns = [
    {
      key: 'nombre',
      header: 'Nombre',
      render: (c: ClienteFrecuenteView) => (
        <div>
          <p className="font-medium text-gray-800">{c.nombre}</p>
          {c.email && <p className="text-xs text-gray-400">{c.email}</p>}
        </div>
      ),
    },
    {
      key: 'telefono',
      header: 'Teléfono',
      render: (c: ClienteFrecuenteView) => (
        <span className="text-gray-600">{c.telefono ?? '—'}</span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (c: ClienteFrecuenteView) => (
        <span className="text-gray-600">{c.email ?? '—'}</span>
      ),
    },
    {
      key: 'direccion',
      header: 'Dirección',
      render: (c: ClienteFrecuenteView) => (
        <span className="max-w-[160px] truncate text-gray-600">{c.direccion ?? '—'}</span>
      ),
    },
    {
      key: 'cantidad_compras',
      header: 'Compras',
      render: (c: ClienteFrecuenteView) => (
        <span className="font-medium text-gray-800">{c.cantidad_compras ?? 0}</span>
      ),
    },
    {
      key: 'total_compras',
      header: 'Total',
      render: (c: ClienteFrecuenteView) => (
        <span className="font-medium text-gray-800">{formatCurrency(c.total_compras)}</span>
      ),
    },
    {
      key: 'ultima_compra',
      header: 'Última compra',
      render: (c: ClienteFrecuenteView) => (
        <span className="text-gray-600">{formatDate(c.ultima_compra)}</span>
      ),
    },
    {
      key: 'activo',
      header: 'Estado',
      render: (c: ClienteFrecuenteView) =>
        c.activo ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
            <CircleCheck className="h-3 w-3" />
            Activo
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
            <XCircle className="h-3 w-3" />
            Inactivo
          </span>
        ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      render: (c: ClienteFrecuenteView) => (
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setDetailTarget(c)}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
            title="Ver detalle"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => openEdit(c)}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-fucsia-50 hover:text-fucsia-600"
            title="Editar cliente"
          >
            <Pencil className="h-4 w-4" />
          </button>
          {c.activo && (
            <button
              type="button"
              onClick={() => setDeleteTarget(c)}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
              title="Desactivar cliente"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Clientes frecuentes</h1>
          <p className="mt-1 text-sm text-gray-500">
            Administra los datos de clientes y compradores habituales de la piñatería.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-fucsia-500 to-morado-600 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-fucsia-200 transition-all hover:from-fucsia-600 hover:to-morado-700"
        >
          <Plus className="h-4 w-4" />
          Nuevo cliente
        </button>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nombre, teléfono, email o dirección..."
        />
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value as FilterEstado)}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
        >
          <option value="activos">Activos</option>
          <option value="todos">Todos</option>
          <option value="inactivos">Inactivos</option>
        </select>
        <div />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        emptyMessage={
          search
            ? 'No se encontraron clientes con ese criterio de búsqueda.'
            : 'No hay clientes registrados.'
        }
        keyExtractor={(c) => c.id}
      />

      {/* Create / Edit Modal */}
      <FormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCliente ? 'Editar cliente' : 'Nuevo cliente'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nombre *</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
              placeholder="Nombre completo del cliente"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Teléfono</label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
                placeholder="+52 123 456 7890"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
                placeholder="correo@ejemplo.com"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Dirección</label>
            <input
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
              placeholder="Dirección del cliente"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Observaciones</label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
              placeholder="Notas u observaciones sobre el cliente"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-gradient-to-r from-fucsia-500 to-morado-600 px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-fucsia-200 transition-all hover:from-fucsia-600 hover:to-morado-700 disabled:opacity-60"
            >
              {saving ? 'Guardando...' : editingCliente ? 'Actualizar cliente' : 'Registrar cliente'}
            </button>
          </div>
        </form>
      </FormModal>

      {/* Detail Modal */}
      <FormModal
        isOpen={!!detailTarget}
        onClose={() => setDetailTarget(null)}
        title="Detalle del cliente"
      >
        {detailTarget && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Nombre</p>
                <p className="mt-1 text-sm font-medium text-gray-800">{detailTarget.nombre}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Teléfono</p>
                <p className="mt-1 text-sm text-gray-600">{detailTarget.telefono ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Email</p>
                <p className="mt-1 text-sm text-gray-600">{detailTarget.email ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Estado</p>
                <p className="mt-1">
                  {detailTarget.activo ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                      <CircleCheck className="h-3 w-3" />
                      Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                      <XCircle className="h-3 w-3" />
                      Inactivo
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Dirección</p>
              <p className="mt-1 text-sm text-gray-600">{detailTarget.direccion ?? '—'}</p>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">Estadísticas de compras</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-gray-50 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Compras realizadas</p>
                  <p className="mt-1 text-xl font-bold text-gray-800">{detailTarget.cantidad_compras ?? 0}</p>
                </div>
                <div className="rounded-lg bg-gray-50 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Total comprado</p>
                  <p className="mt-1 text-xl font-bold text-fucsia-600">{formatCurrency(detailTarget.total_compras)}</p>
                </div>
                <div className="rounded-lg bg-gray-50 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Última compra</p>
                  <p className="mt-1 text-xl font-bold text-gray-800">{formatDate(detailTarget.ultima_compra)}</p>
                </div>
              </div>
              {(!detailTarget.cantidad_compras || detailTarget.cantidad_compras === 0) && (
                <p className="mt-3 text-sm text-gray-400">Sin compras registradas</p>
              )}
            </div>

            <div className="flex justify-end border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => setDetailTarget(null)}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </FormModal>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Desactivar cliente"
        message={`¿Estás seguro de desactivar al cliente "${deleteTarget?.nombre}"? Podrás reactivarlo después.`}
        confirmText="Desactivar"
      />
    </motion.div>
  )
}
