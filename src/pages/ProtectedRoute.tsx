import { Navigate } from 'react-router-dom'
import { authService } from '@/lib/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireSuperAdmin?: boolean
}

export function ProtectedRoute({ children, requireSuperAdmin = false }: ProtectedRouteProps) {
  if (!authService.isAuthenticated() || (requireSuperAdmin && !authService.isSuperAdmin())) {
    return <Navigate to="/login" replace />
  }

  if (requireSuperAdmin && authService.isSuperAdmin()) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
