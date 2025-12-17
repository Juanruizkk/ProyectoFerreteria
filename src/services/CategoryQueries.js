import { fetchWithAuth } from "@/lib/fetchWithAuth";

// services/categorias.js
const API_URL = "http://localhost:5019/Category"

// Mapeo de errores del backend a mensajes amigables
export const errorMessages = {
  'category_already_exists': 'Esta categoría ya existe en el sistema',
  'category_not_found': 'La categoría no fue encontrada',
  'category_name_in_use': 'Este nombre ya está siendo usado por otra categoría',
  'category_in_use': 'No se puede eliminar esta categoría porque está siendo usada por productos',
  'error_inesperado': 'Ocurrió un error inesperado. Por favor, intenta nuevamente'
}

export async function fetchCategorias() {
  const res = await fetchWithAuth(API_URL)
  if (!res.ok) throw new Error("Error al obtener categorías")
  const data = await res.json();

  return data.map((c, index) => ({
    id: c.idCategoria ?? c.IdCategoria ?? c.id_categoria ?? c.categoryId ?? c.Id ?? index,
    idCategoria: c.idCategoria ?? c.IdCategoria ?? c.id_categoria ?? c.Id ?? index,
    categoria: c.categoria ?? c.Categoria ?? "",
    descripcion: c.descripcion ?? c.Descripcion ?? ""
  }));
}

export async function fetchCategoriaById(id) {
  const res = await fetch(`${API_URL}/${id}`)
  if (!res.ok) {
    if (res.status === 404) throw new Error("category_not_found")
    throw new Error("Error al obtener la categoría")
  }
  const data = await res.json()

  // Normalizar el formato de los datos
  return {
    id: data.idCategoria ?? data.IdCategoria ?? data.Id ?? id,
    idCategoria: data.idCategoria ?? data.IdCategoria ?? data.Id ?? id,
    categoria: data.categoria ?? data.Categoria ?? "",
    descripcion: data.descripcion ?? data.Descripcion ?? ""
  }
}

export async function createCategoria(categoria) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      idCategoria: 0,
      categoria: categoria.categoria.trim(),
      descripcion: categoria.descripcion?.trim() || ""
    })
  })

  if (!res.ok) {
    const errorText = await res.text()
    // El backend puede devolver el código de error como texto plano o JSON
    try {
      const errorJson = JSON.parse(errorText)
      throw new Error(errorJson.message || errorJson.error || "error_inesperado")
    } catch {
      throw new Error(errorText || "error_inesperado")
    }
  }

  const data = await res.json()

  // Normalizar el formato de los datos
  return {
    id: data.idCategoria ?? data.IdCategoria ?? data.Id ?? 0,
    idCategoria: data.idCategoria ?? data.IdCategoria ?? data.Id ?? 0,
    categoria: data.categoria ?? data.Categoria ?? "",
    descripcion: data.descripcion ?? data.Descripcion ?? ""
  }
}

export async function updateCategoria(id, categoria) {
  const res = await fetch(`${API_URL}/update`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      idCategoria: id,
      categoria: categoria.categoria.trim(),
      descripcion: categoria.descripcion?.trim() || ""
    })
  })

  if (!res.ok) {
    const errorText = await res.text()
    try {
      const errorJson = JSON.parse(errorText)
      throw new Error(errorJson.message || errorJson.error || "error_inesperado")
    } catch {
      throw new Error(errorText || "error_inesperado")
    }
  }

  const data = await res.json()

  // Normalizar el formato de los datos
  return {
    id: data.idCategoria ?? data.IdCategoria ?? data.Id ?? id,
    idCategoria: data.idCategoria ?? data.IdCategoria ?? data.Id ?? id,
    categoria: data.categoria ?? data.Categoria ?? "",
    descripcion: data.descripcion ?? data.Descripcion ?? ""
  }
}

export async function deleteCategoria(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "DELETE"
  })

  if (!res.ok) {
    const errorText = await res.text()
    try {
      const errorJson = JSON.parse(errorText)
      throw new Error(errorJson.message || errorJson.error || "error_inesperado")
    } catch {
      throw new Error(errorText || "error_inesperado")
    }
  }

  return true
}
