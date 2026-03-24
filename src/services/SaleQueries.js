import { fetchWithAuth } from "@/lib/fetchWithAuth";

const API_URL = "http://localhost:5019/api/sale";
const API_PENDING_URL = "http://localhost:5019/api/PendingSale";
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
    } catch {
      // Si falla todo, usar mensaje por defecto
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();

  // La respuesta puede contener:
  // - venta normal: { idVenta, ... }
  // - venta pendiente: { idVentaPendiente, estado: "Pendiente de Autorización", ... }
  return {
    ...data,
    id: data.idVenta ?? data.saleId ?? data.Id,
    idVentaPendiente: data.idVentaPendiente,
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
    } catch {
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

/**
 * Obtiene listado de ventas con paginación y filtros opcionales
 * @param {number} pageNumber - Número de página (por defecto 1)
 * @param {number} pageSize - Tamaño de página (por defecto 10)
 * @param {string} clienteFilter - Filtro por nombre o razón social del cliente (opcional)
 * @param {string} fechaDesde - Filtro por fecha desde en formato ISO (opcional)
 * @param {string} fechaHasta - Filtro por fecha hasta en formato ISO (opcional)
 * @returns {Object} Objeto con paginación { items, pagedIndex, totalPages, totalCount, hasPreviousPage, hasNextPage }
 */
export async function fetchSales(
  pageNumber = 1,
  pageSize = 10,
  clienteFilter = null,
  fechaDesde = null,
  fechaHasta = null,
  estado = null
) {
  let url = `${API_URL}?pageNumber=${pageNumber}&pageSize=${pageSize}`;

  if (clienteFilter && clienteFilter.trim() !== "") {
    url += `&clienteFilter=${encodeURIComponent(clienteFilter)}`;
  }

  if (fechaDesde) {
    url += `&fechaDesde=${encodeURIComponent(fechaDesde)}`;
  }

  if (fechaHasta) {
    url += `&fechaHasta=${encodeURIComponent(fechaHasta)}`;
  }

  if (estado) {
    url += `&estado=${encodeURIComponent(estado)}`;
  }

  const response = await fetchWithAuth(url);

  if (!response.ok) {
    let errorMessage = "Error al obtener las ventas";
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
    } catch {
      // Si falla todo, usar mensaje por defecto
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();

  return {
    ...data,
    items: (data.items || []).map((sale, index) => ({
      ...sale,
      id: sale.idVenta ?? sale.saleId ?? sale.Id ?? index,
    })),
  };
}

/**
 * Obtiene el detalle completo de una venta por ID
 * @param {number} id - ID de la venta
 * @returns {Object} Detalle completo de la venta incluyendo items
 */
export async function fetchSaleById(id) {
  if (!id) {
    throw new Error("El ID de la venta es requerido");
  }

  const response = await fetchWithAuth(`${API_URL}/${id}`);

  if (!response.ok) {
    let errorMessage = "Error al obtener el detalle de la venta";
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
    } catch {
      // Si falla todo, usar mensaje por defecto
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();

  return {
    ...data,
    id: data.idVenta ?? data.saleId ?? data.Id,
  };
}

/**
 * Obtiene listado de ventas pendientes de autorización
 * @returns {Array} Lista de ventas pendientes
 */
export async function fetchPendingSales() {
  const response = await fetchWithAuth(`${API_PENDING_URL}`);

  if (!response.ok) {
    let errorMessage = "Error al obtener ventas pendientes";
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
    } catch {
      // Si falla todo, usar mensaje por defecto
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();

  return (data || []).map((sale, index) => ({
    ...sale,
    id: sale.idVentaPendiente ?? sale.id ?? index,
  }));
}

/**
 * Obtiene el detalle completo de una venta pendiente por ID
 * @param {number} id - ID de la venta pendiente
 * @returns {Object} Detalle completo de la venta pendiente
 */
export async function fetchPendingSaleById(id) {
  if (!id) {
    throw new Error("El ID de la venta pendiente es requerido");
  }

  const response = await fetchWithAuth(`${API_PENDING_URL}/${id}`);

  if (!response.ok) {
    let errorMessage = "Error al obtener el detalle de la venta pendiente";
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
    } catch {
      // Si falla todo, usar mensaje por defecto
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();

  return {
    ...data,
    id: data.idVentaPendiente ?? data.id,
  };
}

/**
 * Aprueba una venta pendiente
 * @param {number} id - ID de la venta pendiente
 * @param {string} observaciones - Observaciones de la aprobación (opcional)
 * @returns {Object} Resultado de la aprobación
 */
export async function approvePendingSale(id, observaciones = "") {
  if (!id) {
    throw new Error("El ID de la venta pendiente es requerido");
  }

  const response = await fetchWithAuth(`${API_PENDING_URL}/${id}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ observaciones }),
  });

  if (!response.ok) {
    let errorMessage = "Error al aprobar la venta";
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
    } catch {
      // Si falla todo, usar mensaje por defecto
    }
    throw new Error(errorMessage);
  }

  return await response.json();
}

/**
 * Rechaza una venta pendiente
 * @param {number} id - ID de la venta pendiente
 * @param {string} observaciones - Motivo del rechazo (obligatorio)
 * @returns {Object} Resultado del rechazo
 */
export async function rejectPendingSale(id, observaciones) {
  if (!id) {
    throw new Error("El ID de la venta pendiente es requerido");
  }

  if (!observaciones || observaciones.trim() === "") {
    throw new Error("Las observaciones son obligatorias al rechazar una venta");
  }

  const response = await fetchWithAuth(`${API_PENDING_URL}/${id}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ observaciones }),
  });

  if (!response.ok) {
    let errorMessage = "Error al rechazar la venta";
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
    } catch {
      // Si falla todo, usar mensaje por defecto
    }
    throw new Error(errorMessage);
  }

  return await response.json();
}

/**
 * Descarga el PDF de una venta
 * @param {number} id - ID de la venta
 * @param {string} codigoVenta - Código de la venta para el nombre del archivo
 */
export async function downloadSalePdf(id, codigoVenta) {
  if (!id) {
    throw new Error("El ID de la venta es requerido");
  }

  try {
    const response = await fetchWithAuth(`${API_URL}/${id}/pdf`);

    if (!response.ok) {
      let errorMessage = "Error al descargar el comprobante";
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
      } catch {
        // Si falla todo, usar mensaje por defecto
      }
      throw new Error(errorMessage);
    }

    // Obtener el blob del PDF
    const blob = await response.blob();

    // Crear un enlace temporal para descargar
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Venta_${codigoVenta || id}.pdf`;
    document.body.appendChild(a);
    a.click();

    // Limpiar
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    throw error;
  }
}

/**
 * Anula una venta y genera una nota de crédito en la CC del cliente
 * @param {number} idVenta
 * @param {{ idMotivo: number, detalleAdicional: string|null, idUsuarioRegistra: number }} body
 * @returns {Promise<{ idVenta, codigoVenta, estado, idMovimientoNc }>}
 */
export async function annulSale(idVenta, body) {
  const response = await fetchWithAuth(`${API_URL}/${idVenta}/annul`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const ct = response.headers.get("content-type");
    if (ct?.includes("application/json")) {
      const data = await response.json();
      throw new Error(data.message || data.error || data.title || "Error al anular la venta");
    }
    const text = await response.text();
    throw new Error(text || "Error al anular la venta");
  }

  return response.json();
}

/**
 * Obtiene motivos de nota de crédito
 * @param {boolean|undefined} activo - true = activos, false = inactivos, undefined = todos
 * @returns {Promise<Array>}
 */
export async function getCreditNoteReasons(activo) {
  const params = new URLSearchParams();
  if (activo !== undefined) params.set("activo", activo);
  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await fetchWithAuth(`${API_URL}/credit-note/reasons${query}`);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Error al obtener motivos de nota de crédito");
  }
  return response.json();
}

/**
 * Crea un motivo de nota de crédito
 * @param {{ nombre: string }} body
 */
export async function createCreditNoteReason(body) {
  const response = await fetchWithAuth(`${API_URL}/credit-note/reasons`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Error al crear el motivo");
  }
  const ct = response.headers.get("content-type");
  return ct?.includes("application/json") ? response.json() : response.text();
}

/**
 * Actualiza un motivo de nota de crédito
 * @param {{ idMotivo: number, nombre: string }} body
 */
export async function updateCreditNoteReason(body) {
  const response = await fetchWithAuth(`${API_URL}/credit-note/reasons`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Error al actualizar el motivo");
  }
  const ct = response.headers.get("content-type");
  return ct?.includes("application/json") ? response.json() : response.text();
}

/**
 * Activa o desactiva un motivo de nota de crédito
 * @param {number} id
 * @param {boolean} activo
 */
export async function toggleCreditNoteReasonState(id, activo) {
  const response = await fetchWithAuth(
    `${API_URL}/credit-note/reasons/toggle-state/${id}/${activo}`,
    { method: "PATCH" }
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Error al cambiar el estado del motivo");
  }
}

/**
 * Descarga el PDF de la nota de crédito de una venta anulada
 * @param {number} idVenta
 * @param {string} codigoVenta - Código para el nombre del archivo
 */
export async function downloadCreditNotePdf(idVenta, codigoVenta) {
  if (!idVenta) throw new Error("El ID de la venta es requerido");

  const response = await fetchWithAuth(`${API_URL}/${idVenta}/credit-note-pdf`);

  if (!response.ok) {
    let errorMessage = "Error al descargar la nota de crédito";
    try {
      const ct = response.headers.get("content-type");
      if (ct?.includes("application/json")) {
        const data = await response.json();
        errorMessage = data.message || data.error || data.title || errorMessage;
      } else {
        const text = await response.text();
        if (text?.trim()) errorMessage = text;
      }
    } catch { /* usar mensaje por defecto */ }
    throw new Error(errorMessage);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `NotaCredito_${codigoVenta || idVenta}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

/**
 * Descarga el PDF de una venta pendiente
 * @param {number} id - ID de la venta pendiente
 * @param {string} codigoVenta - Código de la venta para el nombre del archivo
 */
export async function downloadPendingSalePdf(id, codigoVenta) {
  if (!id) {
    throw new Error("El ID de la venta pendiente es requerido");
  }

  try {
    const response = await fetchWithAuth(`${API_PENDING_URL}/${id}/pdf`);

    if (!response.ok) {
      let errorMessage = "Error al descargar el comprobante";
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
      } catch {
        // Si falla todo, usar mensaje por defecto
      }
      throw new Error(errorMessage);
    }

    // Obtener el blob del PDF
    const blob = await response.blob();

    // Crear un enlace temporal para descargar
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `VentaPendiente_${codigoVenta || id}.pdf`;
    document.body.appendChild(a);
    a.click();

    // Limpiar
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    throw error;
  }
}
