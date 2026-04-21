"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { fetchIssues, type Issue } from "@/lib/api";

const STATUS_STYLE: Record<Issue["status"], string> = {
  발생: "bg-blue-500/20 text-blue-400",
  확산: "bg-yellow-500/20 text-yellow-400",
  정점: "bg-red-500/20 text-red-400",
  소강: "bg-gray-500/20 text-gray-400",
};

export default function IssueList() {
  const { data: session, status } = useSession();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (status === "loading") return;
    const token = (session as { accessToken?: string } | null)?.accessToken;
    setLoading(true);
    fetchIssues(token, debouncedQuery || undefined)
      .then(setIssues)
      .catch(() => setError("이슈를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [session, status, debouncedQuery]);

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="이슈 검색..."
        className="w-full rounded-lg bg-gray-800 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-500"
      />

      {loading && <p className="text-gray-400 text-sm">로딩 중...</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {!loading && !error && issues.length === 0 && (
        <p className="text-gray-500 text-sm">검색 결과가 없습니다.</p>
      )}

      <ul className="space-y-3">
        {issues.map((issue) => (
          <li key={issue.issue_id}>
            <Link
              href={`/issues/${issue.issue_id}`}
              className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900 p-4 hover:border-indigo-600 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[issue.status]}`}>
                  {issue.status}
                </span>
                <p className="font-medium">{issue.title}</p>
              </div>
              <span className="text-sm text-gray-400 shrink-0 ml-4">편집 {issue.edit_count}회</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
