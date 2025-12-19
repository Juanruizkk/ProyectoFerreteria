import { fetchWithAuth } from "@/lib/fetchWithAuth";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5019";
const API_URL = `${API_BASE}/api/Audit`;

/**
 * Busca auditorías según los filtros
 * @param {Object} params - Parámetros de búsqueda
 * @param {number} params.pageIndex - Número de página
 * @param {number} params.pageSize - Tamaño de página
 * @param {string} params.searchTerm - Término de búsqueda
 * @param {string} params.accion - Tipo de acción (CREATE, UPDATE, DELETE)
 * @param {string} params.entidadTipo - Tipo de entidad
 * @param {string} params.entidadId - ID de la entidad
 * @param {number} params.idUsuario - ID del usuario
 * @param {string} params.from - Fecha desde (ISO string)
 * @param {string} params.to - Fecha hasta (ISO string)
 * @returns {Promise<Object>} Resultado paginado con auditorías
 */
export async function searchAudit(params) {
  const searchParams = new URLSearchParams();

  // Agregar parámetros solo si tienen valor
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      searchParams.append(key, value);
    }
  });

  const url = `${API_URL}/search?${searchParams.toString()}`;
  const response = await fetchWithAuth(url);

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("No autorizado. Por favor, inicia sesión nuevamente.");
    }
    if (response.status === 403) {
      throw new Error("No tienes permisos para ver la auditoría.");
    }
    if (response.status === 404) {
      throw new Error("Endpoint de auditoría no encontrado.");
    }
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}
