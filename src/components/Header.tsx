import { LogOut, User } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import ThemeToggle from './ui/ThemeToggle'

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
    <header className="flex h-16 items-center justify-end gap-3 border-b border-gray-100 bg-white px-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-2.5 py-1.5 dark:bg-gray-800">
        <ThemeToggle />
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-1.5 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300">
        <User className="h-4 w-4 text-gray-400" />
        <span className="font-medium">{email}</span>
      </div>

      <button
        onClick={handleLogout}
        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-500 transition-all hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/30 dark:hover:text-red-400"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Cerrar sesión</span>
      </button>
    </header>
  )
}
