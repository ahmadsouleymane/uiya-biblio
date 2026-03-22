import { Navigate } from "react-router-dom"
import { useUser } from "../contexts/AuthContext"

export default function PrivateRoute({ children, roles }) {
  const { user, loading } = useUser()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-gray-200 border-t-secondary rounded-full animate-spin" />
    </div>
  )

  if (!user) return <Navigate to="/connexion" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />

  return <>{children}</>
}
