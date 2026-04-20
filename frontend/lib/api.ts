const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type Issue = {
  issue_id: string;
  title: string;
  edit_count: number;
  spike_score: number;
  updated_at: string;
};

async function apiFetch<T>(path: string, token?: string): Promise<T> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { headers });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<T>;
}

export const fetchIssues = (token?: string) =>
  apiFetch<Issue[]>("/issues", token);

export const fetchBriefing = (id: string, token?: string) =>
  apiFetch<unknown>(`/issues/${id}/briefing`, token);

export const fetchSentiment = (id: string, token?: string) =>
  apiFetch<unknown[]>(`/issues/${id}/sentiment`, token);
