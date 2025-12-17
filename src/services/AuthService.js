const API_BASE = "http://localhost:5019";

// Constantes para localStorage
const AUTH_STORAGE_KEY = "auth_session";

/**
 * Realiza el login del usuario
 * @param {string} username - Nombre de usuario
 * @param {string} password - Contraseña
 * @returns {Promise<Object>} Respuesta del login con datos del usuario
 */
export async function login(username, password) {
  const url = `${API_BASE}/api/Login`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      password,
    }),
  });

  if (!response.ok) {
    let errorMessage = "Credenciales inválidas";

    try {
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorData.title || "Credenciales inválidas";
      } else {
        const textError = await response.text();
        if (textError?.trim()) {
          errorMessage = textError;
        }
      }
    } catch (e) {
      // Si falla el parseo, usar mensaje por defecto
    }

    throw new Error(errorMessage);
  }

  const data = await response.json();

  // Almacenar sesión en localStorage
  saveSession(data);

  return data;
}

/**
 * Guarda la sesión del usuario en localStorage
 * @param {Object} sessionData - Datos de sesión del usuario
 */
export function saveSession(sessionData) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionData));
}

/**
 * Obtiene la sesión del usuario desde localStorage
 * @returns {Object|null} Datos de sesión o null si no existe
 */
export function getSession() {
  const sessionData = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!sessionData) {
    return null;
  }

  try {
    const session = JSON.parse(sessionData);

    // Verificar si el token ha expirado
    if (session.expiration) {
      const expirationDate = new Date(session.expiration);
      const now = new Date();

      if (now >= expirationDate) {
        // Token expirado, eliminar sesión
        clearSession();
        return null;
      }
    }

    return session;
  } catch (e) {
    // Si falla el parseo, eliminar datos corruptos
    clearSession();
    return null;
  }
}

/**
 * Elimina la sesión del usuario (logout)
 */
export function clearSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

/**
 * Verifica si el usuario está autenticado
 * @returns {boolean} true si está autenticado, false si no
 */
export function isAuthenticated() {
  const session = getSession();
  return session !== null && session.token !== undefined;
}

/**
 * Obtiene el token JWT del usuario autenticado
 * @returns {string|null} Token JWT o null si no está autenticado
 */
export function getToken() {
  const session = getSession();
  return session?.token || null;
}

/**
 * Obtiene los datos del usuario autenticado
 * @returns {Object|null} Datos del usuario o null si no está autenticado
 */
export function getCurrentUser() {
  const session = getSession();

  if (!session) {
    return null;
  }

  return {
    userId: session.userId,
    username: session.username,
    role: session.role,
    permissions: session.permissions || [],
  };
}

/**
 * Verifica si el usuario tiene un permiso específico
 * @param {string} permission - Permiso a verificar
 * @returns {boolean} true si tiene el permiso, false si no
 */
export function hasPermission(permission) {
  const user = getCurrentUser();

  if (!user || !user.permissions) {
    return false;
  }

  return user.permissions.some(
    (p) => p.toUpperCase() === permission.toUpperCase()
  );
}

/**
 * Cierra la sesión del usuario
 */
export function logout() {
  clearSession();
}
