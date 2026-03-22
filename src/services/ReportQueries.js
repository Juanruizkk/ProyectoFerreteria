const API_BASE = "http://localhost:5019";

function authHeaders() {
  const session = localStorage.getItem("auth_session");
  const token = session ? JSON.parse(session).token : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse(res) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Error ${res.status}`);
  }
  return res.json();
}

export async function fetchTotalVendido(fechaDesde, fechaHasta) {
  const params = new URLSearchParams({ fechaDesde, fechaHasta });
  const res = await fetch(`${API_BASE}/api/Report/total-vendido?${params}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function fetchVentasPorPeriodo(fechaDesde, fechaHasta, agrupacion = "mes") {
  const params = new URLSearchParams({ fechaDesde, fechaHasta, agrupacion });
  const res = await fetch(`${API_BASE}/api/Report/ventas-por-periodo?${params}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function fetchArticuloMasVendido(fechaDesde, fechaHasta) {
  const params = new URLSearchParams({ fechaDesde, fechaHasta });
  const res = await fetch(`${API_BASE}/api/Report/articulo-mas-vendido?${params}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function fetchProductosMasVendidos(fechaDesde, fechaHasta, topN = 10) {
  const params = new URLSearchParams({ fechaDesde, fechaHasta, topN });
  const res = await fetch(`${API_BASE}/api/Report/productos-mas-vendidos?${params}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function fetchCategoriasMasVendidas(fechaDesde, fechaHasta) {
  const params = new URLSearchParams({ fechaDesde, fechaHasta });
  const res = await fetch(`${API_BASE}/api/Report/categorias-mas-vendidas?${params}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}
