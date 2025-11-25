// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"

/**
 * Obtener listado paginado de clientes con búsqueda opcional
 */
export async function getClientes({ pagedIndex = 1, pageSize = 10, search = "" }) {
  const params = new URLSearchParams({
    pagedIndex: pagedIndex.toString(),
    pageSize: pageSize.toString(),
    ...(search && { search }),
  })

  const response = await fetch(`${API_BASE_URL}/clientes?${params}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error("Error al obtener los clientes")
  }

  return response.json()
}

/**
 * Obtener un cliente por ID
 */
export async function getClienteById(id) {
  const response = await fetch(`${API_BASE_URL}/clientes/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error("Error al obtener el cliente")
  }

  return response.json()
}

/**
 * Crear un nuevo cliente
 */
export async function createCliente(clienteData) {
  const response = await fetch(`${API_BASE_URL}/clientes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(clienteData),
  })

  if (!response.ok) {
    throw new Error("Error al crear el cliente")
  }

  return response.json()
}

/**
 * Actualizar un cliente existente
 */
export async function updateCliente(id, clienteData) {
  const response = await fetch(`${API_BASE_URL}/clientes/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(clienteData),
  })

  if (!response.ok) {
    throw new Error("Error al actualizar el cliente")
  }

  return response.json()
}

/**
 * Eliminar un cliente (borrado lógico)
 */
export async function deleteCliente(id) {
  const response = await fetch(`${API_BASE_URL}/clientes/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error("Error al eliminar el cliente")
  }

  return response.json()
}
