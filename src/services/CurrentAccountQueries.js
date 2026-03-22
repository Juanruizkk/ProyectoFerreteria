import { fetchWithAuth } from "@/lib/fetchWithAuth";

const BASE_URL = "http://localhost:5019";

/**
 * Create a new current account for a client
 * @param {Object} accountData - Current account data
 * @param {string} accountData.detalle - Account description
 * @param {number} accountData.limiteCuenta - Account limit
 * @param {number} accountData.idCliente - Client ID
 * @param {number} accountData.idUsuarioRegistra - User ID who registers
 * @param {boolean} accountData.tieneDueda - Has debt
 * @param {number} accountData.saldoActual - Current balance
 * @returns {Promise<Object>} Created account movement
 */
export const createCurrentAccount = async (accountData) => {
  try {
    const response = await fetchWithAuth(`${BASE_URL}/api/CurrentAccount/create-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(accountData),
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error creating current account');
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Error creating current account');
      }
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  } catch (error) {
    console.error('Error creating current account:', error);
    throw error;
  }
};

/**
 * Get current account summary (balances, opening and latest movements)
 * @param {number} clientId - Client ID
 * @returns {Promise<Object>} Summary object { opening, latest }
 */
export const getCurrentAccountSummary = async (clientId) => {
  try {
    const response = await fetchWithAuth(`${BASE_URL}/api/CurrentAccount/summary/${clientId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error fetching account summary");
      } else {
        const errorText = await response.text();
        throw new Error(errorText || "Error fetching account summary");
      }
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching account summary:", error);
    throw error;
  }
};

/**
 * Get paginated current account movements for a specific client
 * @param {number} clientId - Client ID
 * @param {number} pageIndex - Current page
 * @param {string} searchTerm - Search parameter
 * @param {string} fechaDesde - ISO string for start date filter
 * @param {string} fechaHasta - ISO string for end date filter
 * @param {number} idTipoMovimiento - Movement type ID filter
 * @returns {Promise<Object>} Paginated result { items, totalPages, totalCount, etc. }
 */
export const getAccountMovements = async (
  clientId,
  pageIndex = 1,
  searchTerm = "",
  fechaDesde = null,
  fechaHasta = null,
  idTipoMovimiento = null
) => {
  try {
    const params = new URLSearchParams();
    params.set("pageIndex", pageIndex);
    if (searchTerm) params.set("searchTerm", searchTerm);
    if (fechaDesde) params.set("fechaDesde", fechaDesde);
    if (fechaHasta) params.set("fechaHasta", fechaHasta);
    if (idTipoMovimiento) params.set("idTipoMovimiento", idTipoMovimiento);

    const query = params.toString() ? `?${params.toString()}` : "";
    const response = await fetchWithAuth(`${BASE_URL}/api/CurrentAccount/movements/${clientId}${query}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error fetching account movements");
      } else {
        const errorText = await response.text();
        throw new Error(errorText || "Error fetching account movements");
      }
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching account movements:", error);
    throw error;
  }
};

/**
 * Get all movement types available
 * @returns {Promise<Array>} List of movement types
 */
export const getMovementTypes = async () => {
  try {
    const response = await fetchWithAuth(`${BASE_URL}/api/CurrentAccount/movement-types`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error fetching movement types');
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Error fetching movement types');
      }
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching movement types:', error);
    throw error;
  }
};

/**
 * Register a new movement for a client's current account
 * @param {Object} movementData - Movement data
 * @param {number} movementData.idCliente - Client ID
 * @param {number} movementData.importe - Amount
 * @param {string} movementData.detalle - Movement detail/description
 * @param {number} movementData.idTipoMovimiento - Movement type ID
 * @param {number} movementData.idVenta - Sale ID (0 for global payments)
 * @param {number} movementData.idUsuarioRegistra - User ID who registers
 * @returns {Promise<Object>} Created movement
 */
export const registerMovement = async (movementData) => {
  try {
    const response = await fetchWithAuth(`${BASE_URL}/api/CurrentAccount/register-movement`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(movementData),
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error registering movement');
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Error registering movement');
      }
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  } catch (error) {
    console.error('Error registering movement:', error);
    throw error;
  }
};

/**
 * Download the payment receipt PDF for a given movement
 * @param {number} idMovimiento - Payment movement ID
 * @returns {Promise<Blob>} PDF blob
 */
export const getPaymentReceipt = async (idMovimiento) => {
  try {
    const response = await fetchWithAuth(
      `${BASE_URL}/api/CurrentAccount/payment-receipt/${idMovimiento}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      throw new Error('Error al obtener el comprobante de pago');
    }

    return await response.blob();
  } catch (error) {
    console.error('Error fetching payment receipt:', error);
    throw error;
  }
};

/**
 * Annul a payment movement
 * @param {Object} dto
 * @param {number} dto.idMovimientoPago - Payment movement ID to annul
 * @param {number} dto.idUsuarioRegistra - User ID who registers the annulment
 * @param {string} dto.motivo - Reason for annulment (min 10 chars)
 * @returns {Promise<Object>} { idMovimiento: number }
 */
export const annulPayment = async (dto) => {
  try {
    const response = await fetchWithAuth(`${BASE_URL}/api/CurrentAccount/annul-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dto),
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al anular el pago');
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Error al anular el pago');
      }
    }

    return await response.json();
  } catch (error) {
    console.error('Error annulling payment:', error);
    throw error;
  }
};

/**
 * Get active (or all) debit note reasons
 * @param {boolean|undefined} activo - true = only active, false = only inactive, undefined = all
 * @param {string|undefined} categoria - "general" | "ajuste_precio" | "interes_mora" | undefined = all
 * @returns {Promise<Array>} List of DebitNoteReasonDTO
 */
export const getDebitNoteReasons = async (activo, categoria) => {
  try {
    const params = new URLSearchParams();
    if (activo !== undefined) params.set("activo", activo);
    if (categoria !== undefined) params.set("categoria", categoria);
    const query = params.toString() ? `?${params.toString()}` : "";
    const response = await fetchWithAuth(`${BASE_URL}/api/DebitNoteReason/reasons${query}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Error al obtener motivos de nota de débito');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching debit note reasons:', error);
    throw error;
  }
};

/**
 * Register a Nota de Débito for a client
 * @param {Object} body
 * @param {number} body.idCliente
 * @param {number} body.importe
 * @param {number} body.idMotivo
 * @param {string|null} body.detalleAdicional
 * @param {number|null} body.idVenta
 * @param {number} body.idUsuarioRegistra
 * @returns {Promise<Object>} { idMovimiento: number }
 */
export const registerDebitNote = async (body) => {
  try {
    const response = await fetchWithAuth(`${BASE_URL}/api/CurrentAccount/register-debit-note`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Error al registrar la nota de débito');
    }

    return await response.json();
  } catch (error) {
    console.error('Error registering debit note:', error);
    throw error;
  }
};

/**
 * Create a new debit note reason
 * @param {{ nombre: string, categoria: string }} body
 * @returns {Promise<Object>}
 */
export const createDebitNoteReason = async (body) => {
  try {
    const response = await fetchWithAuth(`${BASE_URL}/api/DebitNoteReason/reasons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Error al crear el motivo');
    }

    const contentType = response.headers.get('content-type');
    return contentType?.includes('application/json') ? await response.json() : await response.text();
  } catch (error) {
    console.error('Error creating debit note reason:', error);
    throw error;
  }
};

/**
 * Update a debit note reason
 * @param {{ idMotivo: number, nombre: string, categoria: string }} body
 * @returns {Promise<Object>}
 */
export const updateDebitNoteReason = async (body) => {
  try {
    const response = await fetchWithAuth(`${BASE_URL}/api/DebitNoteReason/reasons`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Error al actualizar el motivo');
    }

    const contentType = response.headers.get('content-type');
    return contentType?.includes('application/json') ? await response.json() : await response.text();
  } catch (error) {
    console.error('Error updating debit note reason:', error);
    throw error;
  }
};

/**
 * Toggle active state of a debit note reason
 * @param {number} idMotivo
 * @param {boolean} activo - new state
 * @returns {Promise<void>}
 */
export const toggleDebitNoteReasonState = async (idMotivo, activo) => {
  try {
    const response = await fetchWithAuth(
      `${BASE_URL}/api/DebitNoteReason/toggle-state/${idMotivo}/${activo}`,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Error al cambiar el estado del motivo');
    }
  } catch (error) {
    console.error('Error toggling debit note reason state:', error);
    throw error;
  }
};

// ─── Interest Config ────────────────────────────────────────────────────────

const parseError = async (response, fallback) => {
  const ct = response.headers.get("content-type");
  if (ct?.includes("application/json")) {
    const data = await response.json();
    throw new Error(data.message || fallback);
  }
  const text = await response.text();
  throw new Error(text || fallback);
};

export const getInterestConfigs = async () => {
  const response = await fetchWithAuth(`${BASE_URL}/api/InterestConfig/interest-configs`);
  if (!response.ok) await parseError(response, "Error al cargar configuraciones de interés");
  return response.json();
};

export const getCurrentInterestConfig = async () => {
  const response = await fetchWithAuth(`${BASE_URL}/api/InterestConfig/interest-configs/current`);
  if (response.status === 404) return null;
  if (!response.ok) await parseError(response, "Error al cargar configuración activa");
  return response.json();
};

export const createInterestConfig = async (body) => {
  const response = await fetchWithAuth(`${BASE_URL}/api/InterestConfig/interest-configs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) await parseError(response, "Error al crear configuración de interés");
};

export const updateInterestConfig = async (body) => {
  const response = await fetchWithAuth(`${BASE_URL}/api/InterestConfig/interest-configs`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) await parseError(response, "Error al actualizar configuración de interés");
};

export const setCurrentInterestConfig = async (idConfig) => {
  const response = await fetchWithAuth(
    `${BASE_URL}/api/InterestConfig/interest-configs/set-current/${idConfig}`,
    { method: "PUT" }
  );
  if (!response.ok) await parseError(response, "Error al marcar configuración como activa");
};

// ─── Overdue clients / Apply interest ───────────────────────────────────────

export const getOverdueClients = async () => {
  const response = await fetchWithAuth(`${BASE_URL}/api/CurrentAccount/overdue-clients`);
  if (!response.ok) await parseError(response, "Error al cargar clientes morosos");
  return response.json();
};

export const applyInterest = async (clientId, idUsuarioRegistra) => {
  const response = await fetchWithAuth(
    `${BASE_URL}/api/CurrentAccount/apply-interest/${clientId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idUsuarioRegistra }),
    }
  );
  if (!response.ok) await parseError(response, "Error al aplicar interés");
  return response.text();
};

export const applyInterestBulk = async (idUsuarioRegistra) => {
  const response = await fetchWithAuth(`${BASE_URL}/api/CurrentAccount/apply-interest/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idUsuarioRegistra }),
  });
  if (!response.ok) await parseError(response, "Error al aplicar interés masivo");
  return response.text();
};

/**
 * Actualiza el límite global de la cuenta corriente de un cliente
 * @param {{ idCliente: number, idConfiguracion: number, idUsuarioRegistra: number, motivo: string }} body
 * @returns {Promise<Object>}
 */
export const updateAccountLimit = async (body) => {
  const response = await fetchWithAuth(`${BASE_URL}/api/CurrentAccount/update-limit`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text();
    let message = "Error al actualizar el límite";
    try {
      const data = JSON.parse(text);
      message = (typeof data === "string" ? data : data.message) || message;
    } catch {
      message = text || message;
    }
    throw new Error(message);
  }
  return response.json();
};

/**
 * Get pending sales for payment for a specific client
 * @param {number} clientId - Client ID
 * @returns {Promise<Array>} List of pending sales with payment information
 */
export const getPendingSales = async (clientId) => {
  try {
    const response = await fetchWithAuth(`${BASE_URL}/api/CurrentAccount/pending-sales/${clientId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error fetching pending sales');
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Error fetching pending sales');
      }
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching pending sales:', error);
    throw error;
  }
};
