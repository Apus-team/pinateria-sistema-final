import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabaseClient'
import { Categoria } from '../types/database'
import toast from 'react-hot-toast'
import { X, Plus, Pencil, Trash2 } from 'lucide-react'
import ConfirmDialog from './ConfirmDialog'

interface CategoriasManagerProps {
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

export default function CategoriasManager({ isOpen, onClose, onUpdate }: CategoriasManagerProps) {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Categoria | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Categoria | null>(null)
  const [saving, setSaving] = useState(false)

  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')

  useEffect(() => {
    if (isOpen) fetchCategorias()
  }, [isOpen])

  const fetchCategorias = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true })

    if (error) {
      toast.error('Error al cargar categorías')
      console.error(error)
    } else {
      setCategorias(data ?? [])
    }
    setLoading(false)
  }

  const openCreate = () => {
    setEditing(null)
    setNombre('')
    setDescripcion('')
    setFormOpen(true)
  }

  const openEdit = (cat: Categoria) => {
    setEditing(cat)
    setNombre(cat.nombre)
    setDescripcion(cat.descripcion ?? '')
    setFormOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nombre.trim()) {
      toast.error('El nombre de la categoría es obligatorio')
      return
    }

    setSaving(true)

    if (editing) {
      const { error } = await supabase
        .from('categorias')
        .update({ nombre: nombre.trim(), descripcion: descripcion.trim() || null })
        .eq('id', editing.id)

      if (error) {
        toast.error('Error al actualizar categoría')
        console.error(error)
      } else {
        toast.success('Categoría actualizada correctamente')
        setFormOpen(false)
        fetchCategorias()
        onUpdate()
      }
    } else {
      const { error } = await supabase
        .from('categorias')
        .insert({ nombre: nombre.trim(), descripcion: descripcion.trim() || null, activo: true })

      if (error) {
        toast.error('Error al crear categoría')
        console.error(error)
      } else {
        toast.success('Categoría registrada correctamente')
        setFormOpen(false)
        fetchCategorias()
        onUpdate()
      }
    }

    setSaving(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    const { error } = await supabase
      .from('categorias')
      .update({ activo: false })
      .eq('id', deleteTarget.id)

    if (error) {
      toast.error('Error al eliminar categoría')
      console.error(error)
    } else {
      toast.success('Categoría eliminada correctamente')
      setDeleteTarget(null)
      fetchCategorias()
      onUpdate()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-xl dark:bg-gray-900 dark:shadow-gray-900/50"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Gestionar Categorías</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {formOpen ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre *</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  placeholder="Nombre de la categoría"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-fucsia-400 focus:ring-2 focus:ring-fucsia-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  placeholder="Descripción opcional"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-lg bg-gradient-to-r from-fucsia-500 to-morado-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:from-fucsia-600 hover:to-morado-700 disabled:opacity-60"
                >
                  {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          ) : (
            <>
              <button
                type="button"
                onClick={openCreate}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 px-4 py-3 text-sm font-medium text-gray-500 transition-colors hover:border-fucsia-300 hover:text-fucsia-600 dark:border-gray-700 dark:text-gray-400 dark:hover:border-fucsia-600"
              >
                <Plus className="h-4 w-4" />
                Nueva categoría
              </button>

              {loading ? (
                <p className="text-center text-sm text-gray-400 dark:text-gray-500">Cargando...</p>
              ) : categorias.length === 0 ? (
                <p className="text-center text-sm text-gray-400 dark:text-gray-500">No hay categorías registradas.</p>
              ) : (
                <div className="space-y-2">
                  {categorias.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 dark:border-gray-800"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{cat.nombre}</p>
                        {cat.descripcion && (
                          <p className="text-xs text-gray-400 dark:text-gray-500">{cat.descripcion}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(cat)}
                          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-fucsia-600 dark:hover:bg-gray-800 dark:hover:text-fucsia-400"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(cat)}
                          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar categoría"
        message={`¿Estás seguro de eliminar la categoría "${deleteTarget?.nombre}"? Los productos asociados no se eliminarán.`}
        confirmText="Eliminar"
      />
    </div>
  )
}
