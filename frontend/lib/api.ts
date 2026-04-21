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

export const fetchIssues = (token?: string, q?: string) =>
  apiFetch<Issue[]>(`/issues${q ? `?q=${encodeURIComponent(q)}` : ""}`, token);

export const fetchBriefing = (id: string, token?: string) =>
  apiFetch<unknown>(`/issues/${id}/briefing`, token);

export const fetchSentiment = (id: string, token?: string) =>
  apiFetch<unknown[]>(`/issues/${id}/sentiment`, token);
