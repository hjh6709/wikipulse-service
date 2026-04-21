"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { fetchIssues, type Issue } from "@/lib/api";

const STATUS_STYLE: Record<Issue["status"], { badge: string; border: string }> = {
  발생: { badge: "bg-sky-500/15 text-sky-400",   border: "border-l-sky-500" },
  확산: { badge: "bg-yellow-500/15 text-yellow-400", border: "border-l-yellow-500" },
  정점: { badge: "bg-red-500/15 text-red-400",     border: "border-l-red-500" },
  소강: { badge: "bg-stone-500/15 text-stone-400",   border: "border-l-stone-500" },
};

function relativeTime(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)   return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}일 전`;
  return new Date(dateStr).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
}

function IssueSkeletons() {
  return (
    <ul className="space-y-2">
      {[...Array(4)].map((_, i) => (
        <li key={i} className="rounded-xl border border-stone-800 border-l-4 border-l-stone-700 bg-stone-900 p-4 animate-pulse">
          <div className="space-y-2">
            <div className="h-4 w-2/3 rounded bg-stone-700" />
            <div className="h-3 w-1/3 rounded bg-stone-800" />
          </div>
        </li>
      ))}
    </ul>
  );
}

type StatusFilter = "전체" | Issue["status"];
const STATUS_FILTERS: StatusFilter[] = ["전체", "발생", "확산", "정점", "소강"];

export default function IssueList() {
  const { data: session, status } = useSession();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("전체");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (status === "loading") return;
    const token = (session as { accessToken?: string } | null)?.accessToken;
    setLoading(true);
    setError(null);
    setCursor(undefined);
    fetchIssues(token, debouncedQuery || undefined)
      .then((data) => {
        setIssues(data);
        setHasMore(data.length >= 5);
        if (data.length > 0) setCursor(data[data.length - 1].issue_id);
      })
      .catch(() => setError("이슈를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [session, status, debouncedQuery]);

  async function loadMore() {
    if (!cursor || loadingMore) return;
    const token = (session as { accessToken?: string } | null)?.accessToken;
    setLoadingMore(true);
    try {
      const data = await fetchIssues(token, debouncedQuery || undefined, cursor);
      setIssues((prev) => [...prev, ...data]);
      setHasMore(data.length >= 5);
      if (data.length > 0) setCursor(data[data.length - 1].issue_id);
      else setHasMore(false);
    } catch {
      // silently fail on load more
    } finally {
      setLoadingMore(false);
    }
  }

  const filtered = statusFilter === "전체"
    ? issues
    : issues.filter((i) => i.status === statusFilter);

  return (
    <div className="space-y-4">
      {/* 상태 필터 */}
      <div className="flex gap-1.5">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
              statusFilter === s
                ? "border-amber-500 bg-amber-500/10 text-amber-500 font-medium"
                : "border-stone-700 text-stone-500 hover:text-stone-300 hover:border-stone-600"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* 검색 */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이슈 검색..."
          className="w-full rounded-lg bg-stone-800 pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-stone-500"
        />
      </div>

      {loading && <IssueSkeletons />}
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {!loading && !error && filtered.length === 0 && (
        <p className="text-stone-400 text-sm">
          {debouncedQuery ? "검색 결과가 없습니다." : statusFilter !== "전체" ? `${statusFilter} 상태 이슈가 없습니다.` : "이슈가 없습니다."}
        </p>
      )}

      {!loading && (
        <ul className="space-y-2">
          {filtered.map((issue) => {
            const style = STATUS_STYLE[issue.status];
            return (
              <li key={issue.issue_id}>
                <Link
                  href={`/issues/${issue.issue_id}`}
                  className={`group flex items-center gap-4 rounded-xl border border-stone-800 border-l-4 bg-stone-900 p-4 hover:bg-stone-800/60 transition-all ${style.border}`}
                >
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <p className="text-sm font-semibold leading-snug truncate group-hover:text-white transition-colors">
                      {issue.title}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-stone-400">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${style.badge}`}>
                        {issue.status}
                      </span>
                      <span>{issue.edit_count}회 편집</span>
                      <span className="text-stone-600">·</span>
                      <span>{relativeTime(issue.updated_at)}</span>
                    </div>
                  </div>

                  <svg
                    className="w-4 h-4 text-stone-700 group-hover:text-stone-400 transition-colors shrink-0"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {!loading && hasMore && (
        <button
          onClick={loadMore}
          disabled={loadingMore}
          className="w-full rounded-lg border border-stone-800 py-2.5 text-sm text-stone-400 hover:border-stone-700 hover:text-white disabled:opacity-50 transition-colors"
        >
          {loadingMore ? "로딩 중..." : "더 보기"}
        </button>
      )}
    </div>
  );
}
