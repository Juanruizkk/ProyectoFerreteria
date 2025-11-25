const API_BASE = "http://localhost:5019";

/**
 * Obtener configuraciones de cuenta corriente activas
 * Endpoint: GET /api/AccountConfig/account-configs
 */
export async function fetchAccountConfigs() {
  const response = await fetch(`${API_BASE}/api/AccountConfig/account-configs`);

  if (!response.ok) {
    throw new Error("Error al obtener configuraciones de cuenta corriente");
  }

  const data = await response.json();

  // Filtrar solo las activas
  return data.filter((config) => config.activo === true);
}
