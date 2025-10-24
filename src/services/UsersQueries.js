const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5019";

export async function searchUsers({ pageIndex = 1, searchTerm = "" } = {}) {
  const url = new URL(`${API_BASE}/api/User/search`);
  url.searchParams.set("pageIndex", pageIndex);
  url.searchParams.set("searchTerm", searchTerm.trim().toLowerCase());
  const res = await fetch(url.toString(), { credentials: "include" });
  if (!res.ok) throw new Error(await res.text());
  return res.json(); // { items, pageIndex, totalPages, totalCount, pageSize }
}

export async function getUserById(id) {
  const url = new URL(`${API_BASE}/api/User/users`);
  url.searchParams.set("id", id);
  const res = await fetch(url.toString(), { credentials: "include" });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return Array.isArray(data) ? data[0] : data; // backend devuelve lista
}

export async function createUser(payload) {
  const res = await fetch(`${API_BASE}/api/User/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateUser(payload) {
  const res = await fetch(`${API_BASE}/api/User/update`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return true;
}

export async function deleteUser(id) {
  const res = await fetch(`${API_BASE}/api/User/delete/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return true;
}
