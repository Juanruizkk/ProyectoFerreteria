/**
 * Configuración centralizada de permisos del sistema
 *
 * Este archivo define:
 * - Grupos de permisos por módulo
 * - Mapeo de rutas a permisos requeridos
 * - Permisos específicos para acciones CRUD
 */

// ============================================
// GRUPOS DE PERMISOS POR MÓDULO
// ============================================

export const PermissionGroups = {
  // Módulo de Usuarios
  USERS: {
    prefix: "USR",
    permissions: {
      CREATE: "USR_CREATE",
      READ: "USR_READ",
      UPDATE: "USR_UPDATE",
      DELETE: "USR_DELETE",
      PASSWORD_UPDATE: "USR_PASSWORD_UPDATE",
    },
  },

  // Módulo de Clientes
  CLIENTS: {
    prefix: "CLI",
    permissions: {
      CREATE: "CLI_CREATE",
      READ: "CLI_READ",
      UPDATE: "CLI_UPDATE",
      DELETE: "CLI_DELETE",
    },
  },

  // Módulo de Productos
  PRODUCTS: {
    prefix: "PROD",
    permissions: {
      CREATE: "PROD_CREATE",
      READ: "PROD_READ",
      UPDATE: "PROD_UPDATE",
      DELETE: "PROD_DELETE",
      BARCODE: "PROD_BARCODE",
      PRICE_UPDATE: "PROD_PRICE_UPDATE",
      STOCK_LOW: "PROD_STOCK_LOW",
      STOCK_IN: "PROD_STOCK_IN",
    },
  },

  // Módulo de Ventas
  SALES: {
    prefix: "VEN",
    permissions: {
      VIEW: "VEN_VIEW",
      CREATE: "VEN_CREATE",
      INVOICE: "VEN_INVOICE",
      NO_STOCK: "VEN_NO_STOCK",
      AUTH_OVERLIMIT: "VEN_AUTH_OVERLIMIT",
    },
  },

  // Módulo de Cuenta Corriente
  CURRENT_ACCOUNT: {
    prefix: "CC",
    permissions: {
      VIEW: "CC_VIEW",
      MANAGE: "CC_MANAGE",
      NOTE_DEBIT: "CC_NOTE_DEBIT",
      NOTE_CREDIT: "CC_NOTE_CREDIT",
    },
  },

  // Módulo de Reportes
  REPORTS: {
    prefix: "REP",
    permissions: {
      GENERATE: "REP_GENERATE",
      EXPORT: "REP_EXPORT",
    },
  },

  // Módulo de Historial
  HISTORY: {
    prefix: "HIS",
    permissions: {
      VIEW: "HIS_VIEW",
    },
  },

  // Módulo de Proveedores
  SUPPLIERS: {
    prefix: "PROV",
    permissions: {
      CREATE: "PROV_CREATE",
      READ: "PROV_READ",
      UPDATE: "PROV_UPDATE",
      DELETE: "PROV_DELETE",
    },
  },

  // Módulo de Listas de Precios
  PRICE_LISTS: {
    prefix: "LP",
    permissions: {
      CREATE: "LP_CREATE",
      READ: "LP_READ",
      UPDATE: "LP_UPDATE",
      DELETE: "LP_DELETE",
      TOGGLE: "LP_TOGGLE",
      ITEM_ADD: "LP_ITEM_ADD",
      ITEM_UPDATE: "LP_ITEM_UPDATE",
      ITEM_DELETE: "LP_ITEM_DELETE",
    },
  },

  // Módulo de Compras a Proveedores
  PURCHASES: {
    prefix: "COMP",
    permissions: {
      CREATE: "COMP_CREATE",
      READ: "COMP_READ",
      UPDATE: "COMP_UPDATE",
      DELETE: "COMP_DELETE",
    },
  },

  // Búsquedas
  SEARCH: {
    prefix: "SEARCH",
    permissions: {
      USER: "SEARCH_USER",
      CLIENT: "SEARCH_CLIENT",
      PRODUCT: "SEARCH_PRODUCT",
      SALE: "SEARCH_SALE",
    },
  },
};

// ============================================
// MAPEO DE RUTAS A GRUPOS DE PERMISOS
// ============================================

/**
 * Define qué permisos se requieren para acceder a cada ruta
 * Si el usuario tiene AL MENOS UNO de los permisos del grupo, puede acceder
 */
export const RoutePermissions = {
  "/usuarios": {
    module: "Usuarios",
    permissionGroup: PermissionGroups.USERS,
    requireAny: true, // Requiere al menos uno de los permisos del grupo
  },
  "/clientes": {
    module: "Clientes",
    permissionGroup: PermissionGroups.CLIENTS,
    requireAny: true,
  },
  "/clientes/:id": {
    module: "Clientes",
    permissionGroup: PermissionGroups.CLIENTS,
    requireAny: true,
  },
  "/productos": {
    module: "Productos",
    permissionGroup: PermissionGroups.PRODUCTS,
    requireAny: true,
  },
  "/configuracion-cc": {
    module: "Configuración de Cuenta Corriente",
    permissionGroup: PermissionGroups.CURRENT_ACCOUNT,
    requireAny: true,
  },
  "/configuracion-ferreteria": {
    module: "Configuración de Ferretería",
    permissionGroup: PermissionGroups.USERS,
    requireAny: true,
  },
  "/ventas": {
    module: "Ventas",
    permissionGroup: PermissionGroups.SALES,
    requireAny: true,
  },
  "/proveedores": {
    module: "Proveedores",
    permissionGroup: PermissionGroups.SUPPLIERS,
    requireAny: true,
  },
  "/proveedores/:id": {
    module: "Proveedores",
    permissionGroup: PermissionGroups.SUPPLIERS,
    requireAny: true,
  },
  "/compras": {
    module: "Compras",
    permissionGroup: PermissionGroups.PURCHASES,
    requireAny: true,
  },
  "/reportes": {
    module: "Reportes",
    permissionGroup: PermissionGroups.REPORTS,
    requireAny: true,
  },
  "/historial": {
    module: "Historial",
    permissionGroup: PermissionGroups.HISTORY,
    requireAny: true,
  },
};

// ============================================
// UTILIDADES
// ============================================

/**
 * Obtiene todos los permisos de un grupo
 * @param {Object} permissionGroup - Grupo de permisos
 * @returns {Array<string>} Lista de permisos
 */
export function getPermissionsFromGroup(permissionGroup) {
  if (!permissionGroup || !permissionGroup.permissions) {
    return [];
  }
  return Object.values(permissionGroup.permissions);
}

/**
 * Obtiene la configuración de permisos para una ruta
 * @param {string} path - Ruta (ej: "/usuarios")
 * @returns {Object|null} Configuración de permisos o null
 */
export function getRoutePermissionConfig(path) {
  // Buscar coincidencia exacta primero
  if (RoutePermissions[path]) {
    return RoutePermissions[path];
  }

  // Buscar coincidencia con parámetros (ej: /clientes/:id)
  for (const [routePath, config] of Object.entries(RoutePermissions)) {
    if (routePath.includes(":")) {
      // Convertir /clientes/:id a regex
      const regexPath = routePath.replace(/:[^/]+/g, "[^/]+");
      const regex = new RegExp(`^${regexPath}$`);
      if (regex.test(path)) {
        return config;
      }
    }
  }

  return null;
}
