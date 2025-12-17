import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated } from "@/services/AuthService";
import { usePermission } from "@/hooks/usePermission";
import { getRoutePermissionConfig, getPermissionsFromGroup } from "@/config/permissions";
import { toast } from "sonner";
import { useEffect, useRef } from "react";

/**
 * Componente que protege rutas requiriendo autenticación y permisos
 *
 * Funcionalidad:
 * 1. Si no está autenticado → redirige a /login
 * 2. Si está autenticado pero no tiene permisos del módulo → redirige a / con mensaje
 * 3. Si tiene permisos → renderiza el componente
 */
export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const { hasAnyPermission } = usePermission();
  const toastShownRef = useRef(false);

  // 1. Verificar autenticación básica
  const authenticated = isAuthenticated();

  // 2. Verificar permisos del módulo
  let hasPermission = true;
  let deniedModule = "";

  if (authenticated && location.pathname !== "/") {
    const routeConfig = getRoutePermissionConfig(location.pathname);

    if (routeConfig) {
      const requiredPermissions = getPermissionsFromGroup(routeConfig.permissionGroup);

      // Si la ruta requiere permisos y el usuario no tiene ninguno
      if (requiredPermissions.length > 0 && !hasAnyPermission(requiredPermissions)) {
        hasPermission = false;
        deniedModule = routeConfig.module;
      }
    }
  }

  // 3. Efecto para mostrar toast de acceso denegado
  useEffect(() => {
    if (!hasPermission && deniedModule && !toastShownRef.current) {
      toast.error("Acceso denegado", {
        description: `No tienes permisos para acceder al módulo de ${deniedModule}`,
      });
      toastShownRef.current = true;
    }

    // Reset del toast cuando cambie la ubicación
    return () => {
      toastShownRef.current = false;
    };
  }, [location.pathname, hasPermission, deniedModule]);

  // 4. Decisión de renderizado (después de todos los hooks)
  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasPermission) {
    return <Navigate to="/" replace />;
  }

  return children;
}
