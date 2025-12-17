import { fetchWithAuth } from "@/lib/fetchWithAuth";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5019";


export async function getPermissionCategories(idCategory) {
  const url = new URL(`${API_BASE}/api/Permission/permissions`);
  if (idCategory != null) url.searchParams.set("id_permissionCategory", idCategory);
  const res = await fetchWithAuth(url.toString(), { credentials: "include" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
