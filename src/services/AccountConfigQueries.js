import { fetchWithAuth } from "@/lib/fetchWithAuth";

const BASE_URL = "http://localhost:5019";

/**
 * Get all account configurations with optional filtering by active status
 * @param {boolean} activo - Optional filter for active status (true/false/null for all)
 * @returns {Promise<Array>} List of account configurations
 */
export const fetchAccountConfigs = async (activo = null) => {
  try {
    let url = `${BASE_URL}/api/AccountConfig/account-configs`;

    if (activo !== null) {
      url += `?activo=${activo}`;
    }

    const response = await fetchWithAuth(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error fetching account configurations');
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Error fetching account configurations');
      }
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching account configurations:', error);
    throw error;
  }
};

/**
 * Get account configuration by ID
 * @param {number} configId - Configuration ID
 * @returns {Promise<Object>} Account configuration
 */
export const fetchAccountConfigById = async (configId) => {
  try {
    const response = await fetchWithAuth(`${BASE_URL}/api/AccountConfig/account-configs/${configId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error fetching account configuration');
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Error fetching account configuration');
      }
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching account configuration:', error);
    throw error;
  }
};

/**
 * Create a new account configuration
 * @param {Object} configData - Configuration data
 * @param {string} configData.nombre - Configuration name
 * @param {number} configData.montoLimite - Limit amount
 * @returns {Promise<void>}
 */
export const createAccountConfig = async (configData) => {
  try {
    const response = await fetchWithAuth(`${BASE_URL}/api/AccountConfig/create-account-configs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(configData),
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error creating account configuration');
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Error creating account configuration');
      }
    }

    return;
  } catch (error) {
    console.error('Error creating account configuration:', error);
    throw error;
  }
};

/**
 * Update an existing account configuration
 * @param {Object} configData - Configuration data
 * @param {number} configData.idConfig - Configuration ID
 * @param {string} configData.nombre - Configuration name
 * @param {number} configData.montoLimite - Limit amount
 * @returns {Promise<void>}
 */
export const updateAccountConfig = async (configData) => {
  try {
    const response = await fetchWithAuth(`${BASE_URL}/api/AccountConfig/update-account-configs`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(configData),
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error updating account configuration');
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Error updating account configuration');
      }
    }

    return;
  } catch (error) {
    console.error('Error updating account configuration:', error);
    throw error;
  }
};

/**
 * Toggle active state of an account configuration
 * @param {number} configId - Configuration ID
 * @param {boolean} active - New active state (true to activate, false to deactivate)
 * @returns {Promise<void>}
 */
export const toggleAccountConfigState = async (configId, active) => {
  try {
    const response = await fetchWithAuth(`${BASE_URL}/api/AccountConfig/toggle-state/${configId}/${active}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error toggling account configuration state');
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Error toggling account configuration state');
      }
    }

    return;
  } catch (error) {
    console.error('Error toggling account configuration state:', error);
    throw error;
  }
};
