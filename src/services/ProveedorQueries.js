import { fetchWithAuth } from "@/lib/fetchWithAuth";

const API_BASE = "http://localhost:5019";
const API_URL = `${API_BASE}/Proveedor`;
const LP_URL = `${API_BASE}/ListaPrecio`;

async function parseError(response, defaultMessage) {
  try {
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const data = await response.json();
      return data.message || data.error || data.title || defaultMessage;
    }
    const text = await response.text();
    if (text?.trim()) return text;
  } catch {}
  return defaultMessage;
}

export async function fetchProveedores(
  pageIndex = 1,
  pageSize = 10,
  searchTerm = "",
  estado = "activos"
) {
  const url = `${API_URL}/search?pageIndex=${pageIndex}&pageSize=${pageSize}&searchTerm=${encodeURIComponent(searchTerm)}&estado=${estado}`;
  const res = await fetchWithAuth(url);
  if (!res.ok) throw new Error(await parseError(res, "Error al obtener los proveedores"));
  return res.json();
}

export async function getProveedorById(id) {
  const res = await fetchWithAuth(`${API_URL}/${id}`);
  if (!res.ok) throw new Error(await parseError(res, "Error al obtener el proveedor"));
  return res.json();
}

export async function createProveedor(data) {
  const res = await fetchWithAuth(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await parseError(res, "Error al crear el proveedor"));
  return res.json();
}

export async function updateProveedor(data) {
  const res = await fetchWithAuth(`${API_URL}/update`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await parseError(res, "Error al actualizar el proveedor"));
  return res.json();
}

export async function deleteProveedor(id) {
  const res = await fetchWithAuth(`${API_URL}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await parseError(res, "Error al eliminar el proveedor"));
  return true;
}

export async function toggleEstadoProveedor(id) {
  const res = await fetchWithAuth(`${API_URL}/${id}/toggle-estado`, { method: "PATCH" });
  if (!res.ok) throw new Error(await parseError(res, "Error al cambiar el estado del proveedor"));
  return true;
}

// ── Lista de Precios ────────────────────────────────────────────────────────

export async function fetchListasByProveedor(idProveedor) {
  const res = await fetchWithAuth(`${LP_URL}/proveedor/${idProveedor}`);
  if (!res.ok) throw new Error(await parseError(res, "Error al obtener las listas"));
  return res.json();
}

export async function getListaById(idLista) {
  const res = await fetchWithAuth(`${LP_URL}/${idLista}`);
  if (!res.ok) throw new Error(await parseError(res, "Error al obtener la lista"));
  return res.json();
}

export async function createLista(data) {
  const res = await fetchWithAuth(LP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await parseError(res, "Error al crear la lista"));
}

export async function updateLista(data) {
  const res = await fetchWithAuth(LP_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await parseError(res, "Error al actualizar la lista"));
}

export async function deleteLista(idLista) {
  const res = await fetchWithAuth(`${LP_URL}/${idLista}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await parseError(res, "Error al eliminar la lista"));
}

export async function toggleActivoLista(idLista) {
  const res = await fetchWithAuth(`${LP_URL}/${idLista}/toggle-activo`, { method: "PATCH" });
  if (!res.ok) throw new Error(await parseError(res, "Error al cambiar el estado de la lista"));
}

// ── Items de Lista ───────────────────────────────────────────────────────────

export async function fetchItemsByLista(idLista) {
  const res = await fetchWithAuth(`${LP_URL}/${idLista}/items`);
  if (!res.ok) throw new Error(await parseError(res, "Error al obtener los items"));
  return res.json();
}

export async function addItem(idLista, data) {
  const res = await fetchWithAuth(`${LP_URL}/${idLista}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await parseError(res, "Error al agregar el producto"));
}

export async function updateItem(idLista, idProducto, data) {
  const res = await fetchWithAuth(`${LP_URL}/${idLista}/items/${idProducto}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await parseError(res, "Error al actualizar el producto"));
}

export async function deleteItem(idLista, idProducto) {
  const res = await fetchWithAuth(`${LP_URL}/${idLista}/items/${idProducto}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await parseError(res, "Error al quitar el producto"));
}
