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
 * Get current account movements for a specific client
 * @param {number} clientId - Client ID
 * @returns {Promise<Array>} List of account movements
 */
export const getAccountMovements = async (clientId) => {
  try {
    const response = await fetchWithAuth(`${BASE_URL}/api/CurrentAccount/movements/${clientId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error fetching account movements');
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Error fetching account movements');
      }
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching account movements:', error);
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
