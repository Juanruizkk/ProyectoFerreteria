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

export async function anularCompra(id, motivo) {
  const res = await fetchWithAuth(`${API_URL}/${id}/anular`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ motivo }),
  });
  if (!res.ok) throw new Error(await parseError(res, "Error al anular la compra"));
  return true;
}

// ── Exportación ───────────────────────────────────────────────────────────────

function triggerDownload(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

export async function exportarComprasExcel() {
  const res = await fetchWithAuth(`${API_URL}/export/excel`);
  if (!res.ok) throw new Error(await parseError(res, "Error al exportar compras"));
  triggerDownload(await res.blob(), "compras.xlsx");
}

export async function exportarComprasPdf() {
  const res = await fetchWithAuth(`${API_URL}/export/pdf`);
  if (!res.ok) throw new Error(await parseError(res, "Error al exportar compras"));
  triggerDownload(await res.blob(), "compras.pdf");
}
