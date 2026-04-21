"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { fetchArchivedIssues, type Issue } from "@/lib/api";

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken ?? "";

  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (status === "loading" || !token) return;
    setLoading(true);
    fetchArchivedIssues(token, debouncedQuery || undefined)
      .then(setIssues)
      .catch(() => setIssues([]))
      .finally(() => setLoading(false));
  }, [token, status, debouncedQuery]);

  return (
    <main className="mx-auto max-w-2xl p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">이슈 히스토리</h1>
        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">소강 완료</span>
      </div>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="이슈 검색..."
        className="w-full rounded-lg bg-gray-800 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-500"
      />

      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-800 bg-gray-900 p-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-3 w-24 rounded bg-gray-700" />
                  <div className="h-4 w-56 rounded bg-gray-700" />
                </div>
                <div className="h-3 w-16 rounded bg-gray-700" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && issues.length === 0 && (
        <p className="text-sm text-gray-500">
          {debouncedQuery ? "검색 결과가 없습니다." : "히스토리가 없습니다."}
        </p>
      )}

      {!loading && (
        <ul className="space-y-3">
          {issues.map((issue) => (
            <li key={issue.issue_id}>
              <Link
                href={`/issues/${issue.issue_id}`}
                className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900 p-4 hover:border-gray-700 transition-colors"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-300">{issue.title}</p>
                  <p className="text-xs text-gray-500">편집 {issue.edit_count}회</p>
                </div>
                <div className="text-right space-y-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400">
                    소강
                  </span>
                  <p className="text-xs text-gray-600">
                    {new Date(issue.updated_at).toLocaleDateString("ko-KR")}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
