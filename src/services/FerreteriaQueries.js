import { fetchWithAuth } from "@/lib/fetchWithAuth";

const API_URL = "http://localhost:5019/api/Ferreteria";

/**
 * Obtiene la información de la ferretería
 * @returns {Promise<Object>} Datos de la ferretería
 */
export async function getFerreteria() {
  const response = await fetchWithAuth(API_URL);

  if (!response.ok) {
    let errorMessage = "Error al obtener la información de la ferretería";
    try {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorData.title || errorMessage;
      } else {
        const textError = await response.text();
        if (textError && textError.trim()) {
          errorMessage = textError;
        }
      }
    } catch {
      // Ignorar
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Actualiza la información de la ferretería
 * @param {Object} data - Datos actualizados de la ferretería (FerreteriaUpdateDTO)
 * @returns {Promise<Object>} Resultado de la actualización
 */
export async function updateFerreteria(data) {
  const response = await fetchWithAuth(`${API_URL}/update`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let errorMessage = "Error al actualizar la ferretería";
    try {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorData.title || errorMessage;
      } else {
        const textError = await response.text();
        if (textError && textError.trim()) {
          errorMessage = textError;
        }
      }
    } catch {
      // Ignorar
    }
    throw new Error(errorMessage);
  }

  return response.json();
}
