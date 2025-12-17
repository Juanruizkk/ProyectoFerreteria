import { fetchWithAuth } from "@/lib/fetchWithAuth";

const API_URL = "http://localhost:5019/api/Location"

export async function fetchLocations() {
  // Usar el endpoint /search con pageSize alto para obtener todas las ubicaciones activas
  const res = await fetchWithAuth(`${API_URL}/search?pageIndex=1&pageSize=1000&activos=true`)
  if (!res.ok) throw new Error("Error al obtener ubicaciones")
  const data = await res.json();

  // El endpoint /search devuelve un objeto paginado con estructura { items: [...], ... }
  const items = data.items || data;

  return items.map((c, index) => ({
    ...c,
    id: c.idUbicacion ?? c.locationId ?? c.Id ?? index,
    idUbicacion: c.idUbicacion ?? c.locationId ?? c.Id ?? index,
  }));
}
