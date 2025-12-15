import { fetchWithAuth } from "@/lib/fetchWithAuth";

const API_URL = "http://localhost:5019/Location"

export async function fetchLocations() {
  const res = await fetchWithAuth(API_URL)
  if (!res.ok) throw new Error("Error al obtener ubicaciones")
  const data = await res.json();

  return data.map((c, index) => ({
    ...c,
    id: c.idUbicacion ?? c.locationId ?? c.Id ?? index, // fallback
  }));
}
