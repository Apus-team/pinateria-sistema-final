import { LogOut, User } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

export default function Header() {
  const navigate = useNavigate()
  const [email, setEmail] = useState<string>('')

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession()
      setEmail(data.session?.user?.email ?? '')
    }
    getSession()
  }, [])

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error('Error al cerrar sesión')
    } else {
      toast.success('Sesión cerrada correctamente')
      navigate('/login')
    }
  }

  return (
    <header className="flex h-16 items-center justify-end gap-4 border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <User className="h-4 w-4" />
        <span>{email}</span>
      </div>

      <button
        onClick={handleLogout}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
      >
        <LogOut className="h-4 w-4" />
        Cerrar sesión
      </button>
    </header>
  )
}
