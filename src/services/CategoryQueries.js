// services/categorias.js
const API_URL = "http://localhost:5019/Category"

export async function fetchCategorias() {
  const res = await fetch(API_URL)
  if (!res.ok) throw new Error("Error al obtener categorías")
  const data = await res.json();

  return data.map((c, index) => ({
    ...c,
    id: c.idCategoria ?? c.categoryId ?? c.Id ?? index, // fallback
  }));
}
