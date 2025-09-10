import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthContext } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: ReactNode
  requiredUserType?: 'profissional' | 'usuario'
}

export function ProtectedRoute({ children, requiredUserType }: ProtectedRouteProps) {
  const { user, loading } = useAuthContext()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requiredUserType && user.user_type !== requiredUserType) {
    // Redirecionar baseado no papel do usuário
    switch (user.user_type) {
      case 'profissional':
        return <Navigate to="/beautywall" replace />
      case 'usuario':
        return <Navigate to="/beautywall" replace />
      default:
        return <Navigate to="/beautywall" replace />
    }
  }

  return <>{children}</>
} 