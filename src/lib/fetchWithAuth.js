import { getToken } from "@/services/AuthService";

/**
 * Wrapper de fetch que automáticamente incluye el token de autenticación
 * @param {string} url - URL de la petición
 * @param {RequestInit} options - Opciones de fetch
 * @returns {Promise<Response>} Respuesta de fetch
 */
export async function fetchWithAuth(url, options = {}) {
  const token = getToken();

  // Crear headers combinando los existentes con el Authorization
  const headers = {
    ...options.headers,
  };

  // Solo agregar el token si existe
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Realizar la petición con el token incluido
  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Helper para hacer peticiones GET con autenticación
 * @param {string} url - URL de la petición
 * @param {RequestInit} options - Opciones adicionales de fetch
 * @returns {Promise<Response>} Respuesta de fetch
 */
export async function fetchGet(url, options = {}) {
  return fetchWithAuth(url, {
    ...options,
    method: "GET",
  });
}

/**
 * Helper para hacer peticiones POST con autenticación
 * @param {string} url - URL de la petición
 * @param {any} body - Cuerpo de la petición
 * @param {RequestInit} options - Opciones adicionales de fetch
 * @returns {Promise<Response>} Respuesta de fetch
 */
export async function fetchPost(url, body, options = {}) {
  return fetchWithAuth(url, {
    ...options,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: JSON.stringify(body),
  });
}

/**
 * Helper para hacer peticiones PUT con autenticación
 * @param {string} url - URL de la petición
 * @param {any} body - Cuerpo de la petición
 * @param {RequestInit} options - Opciones adicionales de fetch
 * @returns {Promise<Response>} Respuesta de fetch
 */
export async function fetchPut(url, body, options = {}) {
  return fetchWithAuth(url, {
    ...options,
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: JSON.stringify(body),
  });
}

/**
 * Helper para hacer peticiones DELETE con autenticación
 * @param {string} url - URL de la petición
 * @param {RequestInit} options - Opciones adicionales de fetch
 * @returns {Promise<Response>} Respuesta de fetch
 */
export async function fetchDelete(url, options = {}) {
  return fetchWithAuth(url, {
    ...options,
    method: "DELETE",
  });
}
