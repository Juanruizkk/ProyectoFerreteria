import { fetchWithAuth } from "@/lib/fetchWithAuth";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5019";
const API_URL = `${API_BASE}/api/User`;

export async function searchUsers({ pageIndex = 1, pageSize = 10, searchTerm = "", estado = "activos" }) {
  const url = `${API_URL}/search?pageIndex=${pageIndex}&pageSize=${pageSize}&searchTerm=${encodeURIComponent(searchTerm)}&estado=${estado}`;
  const response = await fetchWithAuth(url);
  if (!response.ok) throw new Error("Error al obtener los usuarios");
  return await response.json();
}

export async function getUserById(id) {
  const url = new URL(`${API_BASE}/api/User/users`);
  url.searchParams.set("id", id);
  const res = await fetchWithAuth(url.toString(), { credentials: "include" });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return Array.isArray(data) ? data[0] : data; // backend devuelve lista
}

export async function createUser(payload) {
  const res = await fetchWithAuth(`${API_URL}/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateUser(payload) {
  const res = await fetchWithAuth(`${API_BASE}/api/User/update`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return true;
}

export async function changePassword(payload) {
  const res = await fetchWithAuth(`${API_BASE}/api/User/change-password`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return true;
}

export async function activateUser(id) {
  const res = await fetchWithAuth(`${API_BASE}/api/User/activate/${id}`, {
    method: "PUT",
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return true;
}

export async function deleteUser(id) {
  const res = await fetchWithAuth(`${API_BASE}/api/User/delete/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return true;
}
