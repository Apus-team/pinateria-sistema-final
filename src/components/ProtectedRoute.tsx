import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import LoadingScreen from './LoadingScreen'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<boolean>(false)

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(!!data.session)
      setLoading(false)
    }

    checkSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(!!session)
    })

    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [])

  if (loading) return <LoadingScreen />

  if (!session) return <Navigate to="/login" replace />

  return <>{children}</>
}
