import { fetchWithAuth } from "@/lib/fetchWithAuth";

const API_BASE = "http://localhost:5019";
const API_URL = `${API_BASE}/CompraProveedor`;

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

export async function fetchCompras() {
  const res = await fetchWithAuth(`${API_URL}/with-details`);
  if (!res.ok) throw new Error(await parseError(res, "Error al obtener las compras"));
  return res.json();
}

export async function getCompraById(id) {
  const res = await fetchWithAuth(`${API_URL}/${id}`);
  if (!res.ok) throw new Error(await parseError(res, "Error al obtener la compra"));
  return res.json();
}

export async function getComprasByProveedor(idProveedor) {
  const res = await fetchWithAuth(`${API_URL}/proveedor/${idProveedor}`);
  if (!res.ok) throw new Error(await parseError(res, "Error al obtener las compras del proveedor"));
  return res.json();
}

export async function createCompra(data) {
  const res = await fetchWithAuth(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await parseError(res, "Error al registrar la compra"));
  return res.json();
}

export async function updateCompra(data) {
  const res = await fetchWithAuth(`${API_URL}/update`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await parseError(res, "Error al actualizar la compra"));
  return res.json();
}

export async function deleteCompra(id) {
  const res = await fetchWithAuth(`${API_URL}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await parseError(res, "Error al eliminar la compra"));
  return true;
}

export async function toggleEstadoCompra(id) {
  const res = await fetchWithAuth(`${API_URL}/${id}/toggle-estado`, { method: "PATCH" });
  if (!res.ok) throw new Error(await parseError(res, "Error al cambiar el estado de la compra"));
  return true;
}
