import { usePermission } from "@/hooks/usePermission";

/**
 * Componente que renderiza children solo si el usuario tiene los permisos requeridos
 *
 * @example
 * // Requiere un permiso específico
 * <PermissionGuard permission="CLI_CREATE">
 *   <Button>Crear Cliente</Button>
 * </PermissionGuard>
 *
 * @example
 * // Requiere AL MENOS UNO de varios permisos
 * <PermissionGuard anyOf={["CLI_CREATE", "CLI_UPDATE"]}>
 *   <Button>Gestionar Clientes</Button>
 * </PermissionGuard>
 *
 * @example
 * // Requiere TODOS los permisos
 * <PermissionGuard allOf={["CLI_CREATE", "CLI_DELETE"]}>
 *   <Button>Acciones Avanzadas</Button>
 * </PermissionGuard>
 *
 * @example
 * // Mostrar algo si NO tiene permiso (fallback)
 * <PermissionGuard
 *   permission="USR_DELETE"
 *   fallback={<span>No tienes permisos para eliminar</span>}
 * >
 *   <Button variant="destructive">Eliminar</Button>
 * </PermissionGuard>
 */
export default function PermissionGuard({
  children,
  permission,
  anyOf,
  allOf,
  fallback = null,
}) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission();

  let hasAccess = false;

  // Verificar permiso único
  if (permission) {
    hasAccess = hasPermission(permission);
  }
  // Verificar al menos uno
  else if (anyOf) {
    hasAccess = hasAnyPermission(anyOf);
  }
  // Verificar todos
  else if (allOf) {
    hasAccess = hasAllPermissions(allOf);
  }
  // Si no se especifica ningún permiso, denegar acceso por defecto
  else {
    hasAccess = false;
  }

  if (!hasAccess) {
    return fallback;
  }

  return children;
}
