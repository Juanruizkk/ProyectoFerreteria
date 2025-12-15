import { Navigate } from "react-router-dom";
import { isAuthenticated } from "@/services/AuthService";

/**
 * Componente que protege rutas requiriendo autenticación
 * Si el usuario no está autenticado, lo redirige al login
 */
export default function ProtectedRoute({ children }) {
  const authenticated = isAuthenticated();

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
