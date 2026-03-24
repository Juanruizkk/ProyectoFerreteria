import { fetchWithAuth } from "@/lib/fetchWithAuth";

const API_BASE = "http://localhost:5019";

/**
 * Obtener listado paginado de clientes con búsqueda opcional
 * Endpoint: GET /api/Cliente/search
 */
export async function fetchClientes(pageIndex = 1, pageSize = 10, searchTerm = "", estado = "activos") {
  let url = `${API_BASE}/api/Cliente/search?pageIndex=${pageIndex}&pageSize=${pageSize}&searchTerm=${encodeURIComponent(searchTerm)}&estado=${estado}`;

  const response = await fetchWithAuth(url);

  if (!response.ok) {
    // Intentar obtener el mensaje de error de la API
    let errorMessage = "Error al obtener los clientes";
    try {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        // Si es JSON, intentar parsearlo
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorData.title || errorMessage;
      } else {
        // Si es texto plano, leer directamente
        const textError = await response.text();
        if (textError && textError.trim()) {
          errorMessage = textError;
        }
      }
    } catch {
      // Si falla todo, usar mensaje por defecto
    }
    throw new Error(errorMessage);
  }

  return await response.json();
}

/**
 * Obtener un cliente por ID
 * Endpoint: GET /api/Cliente/client/{id}
 */
export async function getClienteById(id) {
  const response = await fetchWithAuth(`${API_BASE}/api/Cliente/client/${id}`);

  if (!response.ok) {
    // Intentar obtener el mensaje de error de la API
    let errorMessage = "Error al obtener el cliente";
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
      // Si falla todo, usar mensaje por defecto
    }
    throw new Error(errorMessage);
  }

  return await response.json();
}

/**
 * Crear un nuevo cliente
 * Endpoint: POST /api/Cliente/create
 */
export async function createCliente(clienteData) {
  const response = await fetchWithAuth(`${API_BASE}/api/Cliente/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(clienteData),
  });

  if (!response.ok) {
    // Intentar obtener el mensaje de error de la API
    let errorMessage = "Error al crear el cliente";
    try {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        // Si es JSON, intentar parsearlo
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorData.title || errorMessage;
      } else {
        // Si es texto plano, leer directamente (como "El correo electrónico ya está en uso.")
        const textError = await response.text();
        if (textError && textError.trim()) {
          errorMessage = textError;
        }
      }
    } catch {
      // Si falla todo, usar mensaje por defecto
    }
    throw new Error(errorMessage);
  }

  return await response.json();
}

/**
 * Actualizar un cliente existente
 * Endpoint: PUT /api/Cliente/update
 */
export async function updateCliente(id, clienteData) {
  const response = await fetchWithAuth(`${API_BASE}/api/Cliente/update`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...clienteData, idCliente: id }),
  });

  if (!response.ok) {
    // Intentar obtener el mensaje de error de la API
    let errorMessage = "Error al actualizar el cliente";
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
      // Si falla todo, usar mensaje por defecto
    }
    throw new Error(errorMessage);
  }

  return await response.json();
}

/**
 * Eliminar un cliente (borrado lógico / toggle status)
 * Endpoint: PUT /api/Cliente/toggle-status
 */
export async function deleteCliente(id) {
  const response = await fetchWithAuth(`${API_BASE}/api/Cliente/toggle-status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      idCliente: id,
      isActive: false
    }),
  });

  if (!response.ok) {
    // Intentar obtener el mensaje de error de la API
    let errorMessage = "Error al eliminar el cliente";
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
      // Si falla todo, usar mensaje por defecto
    }
    throw new Error(errorMessage);
  }

  // Intentar parsear como JSON, si falla, devolver texto plano
  try {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    } else {
      // Si es texto plano, devolverlo como string
      return await response.text();
    }
  } catch {
    // Si falla, devolver vacío
    return null;
  }
}

/**
 * Activar un cliente inactivo (toggle status)
 * Endpoint: PUT /api/Cliente/toggle-status
 */
export async function activateCliente(id) {
  const response = await fetchWithAuth(`${API_BASE}/api/Cliente/toggle-status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      idCliente: id,
      isActive: true
    }),
  });

  if (!response.ok) {
    let errorMessage = "Error al activar el cliente";
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
      // Si falla todo, usar mensaje por defecto
    }
    throw new Error(errorMessage);
  }

  // Intentar parsear como JSON, si falla, devolver texto plano
  try {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    } else {
      return await response.text();
    }
  } catch {
    return null;
  }
}
