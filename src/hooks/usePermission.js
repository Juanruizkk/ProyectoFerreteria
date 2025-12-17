import { getCurrentUser } from "@/services/AuthService";

/**
 * Hook para verificar permisos del usuario autenticado
 *
 * @example
 * const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission();
 *
 * if (hasPermission("CLI_CREATE")) {
 *   // Mostrar botón de crear cliente
 * }
 */
export function usePermission() {
  const user = getCurrentUser();
  const userPermissions = user?.permissions || [];

  /**
   * Verifica si el usuario tiene un permiso específico
   * @param {string} permission - Permiso a verificar (ej: "CLI_CREATE")
   * @returns {boolean}
   */
  const hasPermission = (permission) => {
    if (!permission) return false;
    return userPermissions.some(
      (p) => p.toUpperCase() === permission.toUpperCase()
    );
  };

  /**
   * Verifica si el usuario tiene AL MENOS UNO de los permisos especificados
   * @param {Array<string>} permissions - Lista de permisos
   * @returns {boolean}
   */
  const hasAnyPermission = (permissions) => {
    if (!permissions || permissions.length === 0) return false;
    return permissions.some((permission) => hasPermission(permission));
  };

  /**
   * Verifica si el usuario tiene TODOS los permisos especificados
   * @param {Array<string>} permissions - Lista de permisos
   * @returns {boolean}
   */
  const hasAllPermissions = (permissions) => {
    if (!permissions || permissions.length === 0) return false;
    return permissions.every((permission) => hasPermission(permission));
  };

  /**
   * Verifica si el usuario tiene permisos de un grupo específico
   * Útil para determinar si puede acceder a un módulo completo
   * @param {Object} permissionGroup - Grupo de permisos del config
   * @returns {boolean}
   */
  const hasModuleAccess = (permissionGroup) => {
    if (!permissionGroup || !permissionGroup.permissions) return false;
    const groupPermissions = Object.values(permissionGroup.permissions);
    return hasAnyPermission(groupPermissions);
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasModuleAccess,
    userPermissions,
  };
}
