import { Navigate } from "react-router-dom";
import { isAuthenticated } from "@/services/AuthService";

/**
 * Componente que protege rutas requiriendo autenticación
 *
 * Funcionalidad:
 * 1. Si no está autenticado → redirige a /login
 * 2. Si está autenticado → renderiza el componente (los permisos se verifican dentro de cada página)
 *
 * Nota: La verificación de permisos específicos se hace con PermissionGuard dentro de cada página,
 * mostrando un mensaje de "Acceso Denegado" en lugar de redirigir.
 */
export default function ProtectedRoute({ children }) {
  // Verificar solo autenticación básica
  const authenticated = isAuthenticated();

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
