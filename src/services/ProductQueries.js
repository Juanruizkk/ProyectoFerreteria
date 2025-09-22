const API_URL = "http://localhost:5019/Product";

export async function fetchProducts() {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error("Error al obtener los productos");
  }
  const data = await response.json();

  // Normalizar: siempre devolvemos un array con `id`
  return data.map((p, index) => ({
    ...p,
    id: p.idProducto ?? p.productId ?? p.Id ?? index, // fallback
  }));
}
