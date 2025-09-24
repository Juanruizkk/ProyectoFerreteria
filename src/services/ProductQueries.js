const API_URL = "http://localhost:5019/Product";

export async function fetchProductsWithDetails() {
  const response = await fetch(API_URL + "/with-details");
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

export async function createProduct(producto) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(producto),
  });

  if (!response.ok) {
    throw new Error("Error al crear producto");
  }

  const data = await response.json();

  return {
    ...data,
    id: data.idProducto ?? data.productId ?? data.Id, // normalizamos
  };
}