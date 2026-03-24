import { fetchWithAuth } from "@/lib/fetchWithAuth";

const API_URL = "http://localhost:5019/api/StockMovement";

export async function fetchTiposMovimientoStock() {
  const res = await fetchWithAuth(`${API_URL}/tipos`);
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

export async function fetchHistorialStock(idProducto, pageIndex = 1, pageSize = 10, idTipoMovimiento = null) {
  let url = `${API_URL}/producto/${idProducto}/movimientos?pageIndex=${pageIndex}&pageSize=${pageSize}`;
  if (idTipoMovimiento) url += `&idTipoMovimiento=${idTipoMovimiento}`;
  const res = await fetchWithAuth(url);
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

export async function registrarAjusteStock({ idProducto, cantidad, idTipoMovimiento, motivo }) {
  const res = await fetchWithAuth(`${API_URL}/ajuste-manual`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idProducto, cantidad, idTipoMovimiento, motivo }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.mensaje ?? err?.message ?? `Error ${res.status}`);
  }

  return res.json();
}
