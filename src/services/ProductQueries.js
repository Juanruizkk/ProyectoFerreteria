const API_URL = "http://localhost:5019/Product";

export async function fetchProductsWithDetails(activo = true) {
  const response = await fetch(API_URL + `/with-details${`?activo=${activo}`}`);
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
export async function updateProduct(producto) {
  const id = producto.idProducto ?? producto.id ?? producto.productId ?? producto.Id;
  if (!id) throw new Error("updateProduct: id requerido");

  const url = `${API_URL}/update`;
  const headers = { "Content-Type": "application/json" };
  const body = JSON.stringify(producto);

  const res = await fetch(url, { method: "PUT", headers, body });
  if (!res.ok) {
    throw new Error(`PUT ${url} -> ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return {
    ...data,
    id: data.idProducto ?? id,
  };
}

export async function deleteProduct(id) {
  if (!id) throw new Error("deleteProduct: id requerido");
  const url = `${API_URL}/${id}`;
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok) {
    throw new Error(`DELETE ${url} -> ${res.status} ${res.statusText}`);
  }
  return true;
}

