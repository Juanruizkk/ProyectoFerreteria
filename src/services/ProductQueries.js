import { fetchWithAuth } from "@/lib/fetchWithAuth";

const API_URL = "http://localhost:5019/Product";

export async function fetchProductsWithDetails(
  activo = true,
  pageIndex = 1,
  pageSize = 9,
  search = "",
  idCategoria = null
) {
  let url = `${API_URL}/with-details-paged?activo=${activo}&pageIndex=${pageIndex}&pageSize=${pageSize}`

  if (search && search.trim() !== "") {
    url += `&search=${encodeURIComponent(search)}`
  }

  if (idCategoria) {
    url += `&idCategoria=${idCategoria}`
  }

  const response = await fetchWithAuth(url)

  if (!response.ok) {
    throw new Error("Error al obtener los productos")
  }

  const data = await response.json()

  return {
    ...data,
    items: data.items.map((p, index) => ({
      ...p,
      id: p.idProducto ?? p.productId ?? p.Id ?? index,
    })),
  }
}

export async function createProduct(producto) {
  const response = await fetchWithAuth(API_URL, {
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

  const res = await fetchWithAuth(url, { method: "PUT", headers, body });
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
  const res = await fetchWithAuth(url, { method: "DELETE" });
  if (!res.ok) {
    throw new Error(`DELETE ${url} -> ${res.status} ${res.statusText}`);
  }
  return true;
}

export async function toggleProductEstado(id) {
  if (!id) throw new Error("toggleProductEstado: id requerido");

  const url = `${API_URL}/${id}/toggle-estado`;
  const res = await fetchWithAuth(url, { method: "PATCH" });

  if (!res.ok) {
    throw new Error(`PATCH ${url} -> ${res.status} ${res.statusText}`);
  }

  const data = await res.json(); // { idProducto, activo }

  return {
    id: data.idProducto ?? id,
    activo: data.activo,
  };
}

export async function descargarPlantillaCsv() {
  const url = `${API_URL}/export/plantilla-csv`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Error al descargar plantilla CSV: ${res.status} ${res.statusText}`);
  }

  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = "plantilla_productos.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

export async function descargarPlantillaExcel() {
  const url = `${API_URL}/export/plantilla-excel`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Error al descargar plantilla Excel: ${res.status} ${res.statusText}`);
  }

  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = "plantilla_productos.xlsx";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

export async function importarProductos(file) {
  const formData = new FormData();
  formData.append("file", file);

  const url = `${API_URL}/importar`;
  const res = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Error al importar productos: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data; // { productosCreados, productosActualizados, errores }
}

export async function exportarProductosCsv() {
  const url = `${API_URL}/export/csv`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Error al exportar productos CSV: ${res.status} ${res.statusText}`);
  }

  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = "productos.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

export async function exportarProductosExcel() {
  const url = `${API_URL}/export/excel`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Error al exportar productos Excel: ${res.status} ${res.statusText}`);
  }

  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = "productos.xlsx";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
}
