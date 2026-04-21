const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type Issue = {
  issue_id: string;
  title: string;
  edit_count: number;
  spike_score: number;
  status: "발생" | "확산" | "정점" | "소강";
  updated_at: string;
};

async function apiFetch<T>(path: string, token?: string): Promise<T> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { headers });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<T>;
}

export const fetchIssues = (token?: string, q?: string, cursor?: string) => {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (cursor) params.set("cursor", cursor);
  const qs = params.toString();
  return apiFetch<Issue[]>(`/issues${qs ? `?${qs}` : ""}`, token);
};

export const fetchArchivedIssues = (token: string, q?: string) =>
  apiFetch<Issue[]>(`/issues/archived${q ? `?q=${encodeURIComponent(q)}` : ""}`, token);

export const fetchBriefing = (id: string, token?: string) =>
  apiFetch<unknown>(`/issues/${id}/briefing`, token);

export const fetchSentiment = (id: string, token?: string) =>
  apiFetch<unknown[]>(`/issues/${id}/sentiment`, token);

export type UserSettings = { user_id: string; username: string; email: string };
export type Bookmark = { bookmark_id: string; issue_id: string; created_at: string };

export const fetchMe = (token: string) =>
  apiFetch<UserSettings>("/users/me", token);

export const patchMe = (body: Partial<Pick<UserSettings, "username" | "email">>, token: string) =>
  apiMutate<UserSettings>("PATCH", "/users/me", body, token);

export const fetchBookmarks = (token: string) =>
  apiFetch<Bookmark[]>("/users/bookmarks", token);

export const deleteBookmark = (bookmarkId: string, token: string) =>
  apiMutate<void>("DELETE", `/users/bookmarks/${bookmarkId}`, undefined, token);

export const fetchPreferences = (token: string) =>
  apiFetch<{ categories: string[] }>("/users/preferences", token);

export const savePreferences = (categories: string[], token: string) =>
  apiMutate<{ categories: string[] }>("POST", "/users/preferences", { categories }, token);

export type AlertChannel = "discord" | "email";
export type AlertSettings = { issue_id: string; threshold: number; channels: AlertChannel[] };
export const saveAlertSettings = (body: AlertSettings, token: string) =>
  apiMutate<{ status: string }>("POST", "/alerts/settings", body, token);

async function apiMutate<T>(
  method: string,
  path: string,
  body: unknown,
  token: string,
): Promise<T> {
  const headers: HeadersInit = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
