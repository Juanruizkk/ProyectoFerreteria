import { fetchWithAuth } from "@/lib/fetchWithAuth"

const BASE = "http://localhost:5019/api/Location"

async function parseError(res) {
  const text = await res.text()
  try {
    const json = JSON.parse(text)
    return json.message || json.error || text || "Error desconocido"
  } catch {
    return text || "Error desconocido"
  }
}

// Compatibilidad con ProductosPage — devuelve todas las ubicaciones activas como array plano
export async function fetchLocations() {
  const res = await fetchWithAuth(`${BASE}/search?pageIndex=1&pageSize=1000&activos=true`)
  if (!res.ok) throw new Error(await parseError(res))
  const data = await res.json()
  return (data.items ?? []).map((c) => ({ ...c, idUbicacion: c.idUbicacion }))
}

export async function searchLocations({ pageIndex = 1, pageSize = 10, searchTerm = "", activos = true }) {
  const params = new URLSearchParams({ pageIndex, pageSize, searchTerm, activos })
  const res = await fetchWithAuth(`${BASE}/search?${params}`)
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function createLocation(data) {
  const res = await fetchWithAuth(`${BASE}/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (res.ok) return res.json()
  throw new Error(await parseError(res))
}

export async function updateLocation(id, data) {
  const res = await fetchWithAuth(`${BASE}/update/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (res.ok) return res.json()
  throw new Error(await parseError(res))
}

export async function deleteLocation(id) {
  const res = await fetchWithAuth(`${BASE}/delete/${id}`, { method: "DELETE" })
  if (res.ok) return
  throw new Error(await parseError(res))
}

export async function toggleLocation(id) {
  const res = await fetchWithAuth(`${BASE}/toggle/${id}`, { method: "PATCH" })
  if (res.ok) return
  throw new Error(await parseError(res))
}
