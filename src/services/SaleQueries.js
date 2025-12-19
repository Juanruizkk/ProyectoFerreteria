import { fetchWithAuth } from "@/lib/fetchWithAuth";

const API_URL = "http://localhost:5019/api/sale";
const API_BASE = "http://localhost:5019";

/**
 * Crea una nueva venta
 * @param {Object} sale - Datos de la venta
 * @returns {Object} Venta creada o venta pendiente con información de exceso
 */
export async function createSale(sale) {
  const response = await fetchWithAuth(`${API_URL}/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sale),
  });

  if (!response.ok) {
    let errorMessage = "Error al crear la venta";
    try {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorData.title || errorMessage;
      } else {
        const textError = await response.text();
        if (textError && textError.trim()) {
          errorMessage = textError;
        }
      }
    } catch (e) {
      // Si falla todo, usar mensaje por defecto
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();

  // La respuesta puede contener:
  // - venta normal: { idVenta, ... }
  // - venta pendiente: { ventaPendiente: true, excesoCredito: 1500, ... }
  return {
    ...data,
    id: data.idVenta ?? data.saleId ?? data.Id,
  };
}

/**
 * Obtiene todos los productos disponibles para ventas
 * Usa el endpoint de ProductQueries
 */
export async function fetchAvailableProducts(search = "") {
  let url = `${API_BASE}/Product/with-details-paged?activo=true&pageIndex=1&pageSize=1000`;

  if (search && search.trim() !== "") {
    url += `&search=${encodeURIComponent(search)}`;
  }

  const response = await fetchWithAuth(url);

  if (!response.ok) {
    throw new Error("Error al obtener productos disponibles");
  }

  const data = await response.json();

  return (data.items || []).map((product, index) => ({
    ...product,
    id: product.idProducto ?? product.productId ?? product.Id ?? index,
  }));
}

/**
 * Obtiene todos los clientes
 * Usa el endpoint de ClienteQueries
 */
export async function fetchAllClients(search = "") {
  let url = `${API_BASE}/api/Cliente/search?pageIndex=1&pageSize=1000&searchTerm=${encodeURIComponent(search)}&estado=activos`;

  const response = await fetchWithAuth(url);

  if (!response.ok) {
    let errorMessage = "Error al obtener clientes";
    try {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorData.title || errorMessage;
      } else {
        const textError = await response.text();
        if (textError && textError.trim()) {
          errorMessage = textError;
        }
      }
    } catch (e) {
      // Si falla todo, usar mensaje por defecto
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();

  return (data.items || []).map((client, index) => ({
    ...client,
    id: client.idCliente ?? client.clientId ?? client.Id ?? index,
  }));
}
