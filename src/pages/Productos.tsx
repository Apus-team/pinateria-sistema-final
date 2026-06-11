import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabaseClient'
import { ProductoView, Categoria } from '../types/database'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Settings2 } from 'lucide-react'
import DataTable from '../components/DataTable'
import FormModal from '../components/FormModal'
import ConfirmDialog from '../components/ConfirmDialog'
import StatusBadge from '../components/StatusBadge'
import SearchInput from '../components/SearchInput'
import CategoriasManager from '../components/CategoriasManager'

const estadosValidos = ['disponible', 'agotado', 'descontinuado'] as const

const estadoLabels: Record<string, string> = {
  disponible: 'Disponible',
  agotado: 'Agotado',
  descontinuado: 'Descontinuado',
}

interface ProductoForm {
  codigo: string
  nombre: string
  descripcion: string
  categoria_id: string
  precio_venta: string
  stock_actual: string
  stock_minimo: string
  imagen_url: string
  estado: string
}

const emptyForm: ProductoForm = {
  codigo: '',
  nombre: '',
  descripcion: '',
  categoria_id: '',
  precio_venta: '',
  stock_actual: '',
  stock_minimo: '',
  imagen_url: '',
  estado: 'disponible',
}

export default function Productos() {
  const [productos, setProductos] = useState<ProductoView[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState<string>('')
  const [filtroEstado, setFiltroEstado] = useState<string>('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingProducto, setEditingProducto] = useState<ProductoView | null>(null)
  const [form, setForm] = useState<ProductoForm>(emptyForm)
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<ProductoView | null>(null)

  const [categoriasOpen, setCategoriasOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)

    const [productosRes, categoriasRes] = await Promise.all([
      supabase.from('vw_productos').select('*').eq('activo', true).order('nombre', { ascending: true }),
      supabase.from('categorias').select('*').eq('activo', true).order('nombre', { ascending: true }),
    ])

    if (productosRes.error) {
      toast.error('Error al cargar productos')
      console.error(productosRes.error)
    } else {
      setProductos(productosRes.data ?? [])
    }

    if (categoriasRes.error) {
      toast.error('Error al cargar categorías')
      console.error(categoriasRes.error)
    } else {
      setCategorias(categoriasRes.data ?? [])
    }

    setLoading(false)
  }

  const filtered = useMemo(() => {
    let result = [...productos]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          (p.codigo ?? '').toLowerCase().includes(q),
      )
    }

    if (filtroCategoria !== '') {
      result = result.filter((p) => p.categoria_id === filtroCategoria)
    }

    if (filtroEstado) {
      result = result.filter((p) => p.estado === filtroEstado)
    }

    return result
  }, [productos, search, filtroCategoria, filtroEstado])

  const openCreate = () => {
    setEditingProducto(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (producto: ProductoView) => {
    setEditingProducto(producto)
    setForm({
      codigo: producto.codigo ?? '',
      nombre: producto.nombre,
      descripcion: producto.descripcion ?? '',
      categoria_id: producto.categoria_id ?? '',
      precio_venta: String(producto.precio_venta),
      stock_actual: String(producto.stock_actual),
      stock_minimo: String(producto.stock_minimo),
      imagen_url: producto.imagen_url ?? '',
      estado: producto.estado ?? 'disponible',
    })
    setModalOpen(true)
  }

  const validateForm = (): boolean => {
    if (!form.codigo.trim()) {
      toast.error('El código del producto es obligatorio')
      return false
    }
    if (!form.nombre.trim()) {
      toast.error('El nombre del producto es obligatorio')
      return false
    }
    if (!form.categoria_id) {
      toast.error('Debes seleccionar una categoría')
      return false
    }
    if (form.precio_venta === '' || Number(form.precio_venta) < 0) {
      toast.error('El precio de venta debe ser mayor o igual a 0')
      return false
    }
    if (form.stock_actual === '' || Number(form.stock_actual) < 0) {
      toast.error('El stock actual debe ser mayor o igual a 0')
      return false
    }
    if (form.stock_minimo === '' || Number(form.stock_minimo) < 0) {
      toast.error('El stock mínimo debe ser mayor o igual a 0')
      return false
    }
    if (!estadosValidos.includes(form.estado as typeof estadosValidos[number])) {
      toast.error('El estado seleccionado no es válido')
      return false
    }
    return true
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setSaving(true)

    const productoPayload = {
      codigo: form.codigo.trim(),
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      categoria_id: form.categoria_id,
      precio_venta: Number(form.precio_venta),
      stock_actual: Number(form.stock_actual),
      stock_minimo: Number(form.stock_minimo),
      imagen_url: form.imagen_url.trim() || null,
      estado: form.estado,
      activo: true,
    }

    if (editingProducto) {
      const { error } = await supabase
        .from('productos')
        .update(productoPayload)
        .eq('id', editingProducto.id)

      if (error) {
        console.error("Error Supabase producto:", JSON.stringify(error, null, 2))
        toast.error(error.message || 'Error al actualizar producto')
      } else {
        toast.success('Producto actualizado correctamente')
        setModalOpen(false)
        fetchData()
      }
    } else {
      const { error } = await supabase
        .from('productos')
        .insert(productoPayload)

      if (error) {
        console.error("Error Supabase producto:", JSON.stringify(error, null, 2))
        toast.error(error.message || 'Error al guardar producto')
      } else {
        toast.success('Producto registrado correctamente')
        setModalOpen(false)
        fetchData()
      }
    }

    setSaving(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    const { error } = await supabase
      .from('productos')
      .update({ activo: false })
      .eq('id', deleteTarget.id)

    if (error) {
      toast.error('Error al eliminar producto')
      console.error(error)
    } else {
      toast.success('Producto eliminado correctamente')
      setDeleteTarget(null)
      fetchData()
    }
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value)

  const columns = [
    {
      key: 'codigo',
      header: 'Código',
      render: (p: ProductoView) => (
        <span className="font-medium text-gray-900">{p.codigo ?? '—'}</span>
      ),
    },
    {
      key: 'nombre',
      header: 'Nombre',
      render: (p: ProductoView) => (
        <div>
          <p className="font-medium text-gray-800">{p.nombre}</p>
          {p.descripcion && (
            <p className="mt-0.5 max-w-xs truncate text-xs text-gray-400">{p.descripcion}</p>
          )}
        </div>
      ),
    },
    {
      key: 'categoria_nombre',
      header: 'Categoría',
      render: (p: ProductoView) => (
        <span className="inline-block rounded-full bg-morado-50 px-3 py-1 text-xs font-medium text-morado-700">
          {p.categoria_nombre ?? '—'}
        </span>
      ),
    },
    {
      key: 'precio_venta',
      header: 'Precio',
      render: (p: ProductoView) => (
        <span className="font-medium text-gray-800">{formatCurrency(p.precio_venta)}</span>
      ),
    },
    {
      key: 'stock_actual',
      header: 'Stock',
      render: (p: ProductoView) => (
        <span className="font-medium text-gray-800">{p.stock_actual}</span>
      ),
    },
    {
      key: 'stock',
      header: 'Estado',
      render: (p: ProductoView) => (
        <StatusBadge stockActual={p.stock_actual} stockMinimo={p.stock_minimo} estado={p.estado} />
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      render: (p: ProductoView) => (
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => openEdit(p)}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-fucsia-600"
            title="Editar producto"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(p)}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
            title="Eliminar producto"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  const updateForm = (key: keyof ProductoForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Productos</h1>
          <p className="mt-1 text-sm text-gray-500">
            Administra el catálogo de productos de la piñatería.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setCategoriasOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            <Settings2 className="h-4 w-4" />
            Categorías
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-fucsia-500 to-morado-600 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-fucsia-200 transition-all hover:from-fucsia-600 hover:to-morado-700"
          >
            <Plus className="h-4 w-4" />
            Nuevo producto
          </button>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nombre o código..."
        />
        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
        >
          <option value="">Todas las categorías</option>
          {categorias.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.nombre}
            </option>
          ))}
        </select>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
        >
          <option value="">Todos los estados</option>
          {estadosValidos.map((est) => (
            <option key={est} value={est}>
              {estadoLabels[est]}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        emptyMessage={search || filtroCategoria || filtroEstado ? 'No se encontraron productos con los filtros aplicados.' : 'No hay productos registrados.'}
        keyExtractor={(p) => p.id}
      />

      <FormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProducto ? 'Editar producto' : 'Nuevo producto'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Código *</label>
              <input
                type="text"
                value={form.codigo}
                onChange={(e) => updateForm('codigo', e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
                placeholder="Ej: PIN-001"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Categoría *</label>
              <select
                value={form.categoria_id}
                onChange={(e) => updateForm('categoria_id', e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
              >
                <option value="">Seleccionar categoría</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nombre *</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => updateForm('nombre', e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
              placeholder="Nombre del producto"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={(e) => updateForm('descripcion', e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
              placeholder="Descripción del producto (opcional)"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Precio venta *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.precio_venta}
                onChange={(e) => updateForm('precio_venta', e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Stock actual *</label>
              <input
                type="number"
                min="0"
                value={form.stock_actual}
                onChange={(e) => updateForm('stock_actual', e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
                placeholder="0"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Stock mínimo *</label>
              <input
                type="number"
                min="0"
                value={form.stock_minimo}
                onChange={(e) => updateForm('stock_minimo', e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Imagen URL</label>
              <input
                type="url"
                value={form.imagen_url}
                onChange={(e) => updateForm('imagen_url', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
                placeholder="https://ejemplo.com/imagen.jpg"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Estado</label>
              <select
                value={form.estado}
                onChange={(e) => updateForm('estado', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100"
              >
                {estadosValidos.map((est) => (
                  <option key={est} value={est}>
                    {estadoLabels[est]}
                  </option>
                ))}
              </select>
            </div>
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
              {saving ? 'Guardando...' : editingProducto ? 'Actualizar producto' : 'Registrar producto'}
            </button>
          </div>
        </form>
      </FormModal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar producto"
        message={`¿Estás seguro de eliminar el producto "${deleteTarget?.nombre}"? Se desactivará del catálogo.`}
        confirmText="Eliminar"
      />

      <CategoriasManager
        isOpen={categoriasOpen}
        onClose={() => setCategoriasOpen(false)}
        onUpdate={fetchData}
      />
    </motion.div>
  )
}
