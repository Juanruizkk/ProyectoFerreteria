import { fetchWithAuth } from "@/lib/fetchWithAuth"

const API_URL = "http://localhost:5019/api/unidadmedida"

export async function fetchUnidadesMedida() {
  const res = await fetchWithAuth(API_URL)
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}

export async function fetchUnidadesMedidaAdmin() {
  const res = await fetchWithAuth(`${API_URL}/admin`)
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}

function parseError(text) {
  try {
    const err = JSON.parse(text)
    return err?.mensaje ?? err?.message ?? err?.detail ?? err?.title ?? err?.error ?? null
  } catch { return null }
}

export async function createUnidadMedida({ nombre, abreviatura }) {
  const res = await fetchWithAuth(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, abreviatura }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(parseError(text) || text || `Error ${res.status}`)
  }
  return res.json()
}

export async function updateUnidadMedida(id, { nombre, abreviatura }) {
  const res = await fetchWithAuth(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, abreviatura }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(parseError(text) || text || `Error ${res.status}`)
  }
  return res.json()
}

export async function toggleUnidadMedida(id) {
  const res = await fetchWithAuth(`${API_URL}/${id}/toggle`, { method: "PATCH" })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(parseError(text) || text || `Error ${res.status}`)
  }
  return res.json()
}
