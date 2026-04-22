"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { fetchIssues, type Issue } from "@/lib/api";

const STATUS_BADGE: Record<Issue["status"], string> = {
  발생: "text-sky-400",
  확산: "text-blue-500",
  정점: "text-orange-400",
  소강: "text-slate-500",
};

const STATUS_DOT: Record<Issue["status"], string> = {
  발생: "bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.9)]",
  확산: "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.9)]",
  정점: "bg-orange-400 shadow-[0_0_6px_rgba(251,146,60,0.9)]",
  소강: "bg-slate-500",
};

function relativeTime(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)    return "방금 전";
  if (diff < 3600)  return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}일 전`;
  return new Date(dateStr).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
}

function Sparkline({ issueId, editCount }: { issueId: string; editCount: number }) {
  let h = 0;
  for (const c of issueId) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  const pts: number[] = [];
  let v = Math.max(1, editCount * 0.3);
  for (let i = 0; i < 6; i++) {
    h = (h * 1103515245 + 12345) & 0x7fff;
    v = Math.max(1, v + (h / 0x7fff - 0.45) * editCount * 0.4);
    pts.push(v);
  }
  pts.push(editCount);
  const max = Math.max(...pts), min = Math.min(...pts);
  const range = max - min || 1;
  const W = 56, H = 20;
  const pathD = pts
    .map((val, i) => `${i === 0 ? "M" : "L"}${(i / (pts.length - 1)) * W},${H - ((val - min) / range) * (H - 2) - 1}`)
    .join(" ");
  return (
    <svg width={W} height={H} className="shrink-0 opacity-50">
      <path d={pathD} fill="none" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IssueSkeletons() {
  return (
    <ul className="space-y-2">
      {[...Array(4)].map((_, i) => (
        <li key={i} className="flex items-center gap-4 rounded-xl bg-surface ring-1 ring-blue-500/10 px-4 py-4 animate-pulse">
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 rounded bg-slate-700" />
            <div className="h-3 w-1/3 rounded bg-slate-800" />
          </div>
          <div className="h-5 w-14 rounded bg-slate-800 opacity-50" />
          <div className="h-5 w-10 rounded bg-slate-700" />
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
    <div className="space-y-5">
      {/* 탭 필터 + Live 인디케이터 */}
      <div className="flex items-center justify-between border-b border-slate-800">
        <div className="flex gap-6">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`pb-3 text-sm transition-all duration-300 border-b-2 -mb-px ${
                statusFilter === s
                  ? "border-blue-500 text-white font-medium"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 pb-3">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-500" />
          </span>
          <span className="text-xs text-slate-500 font-medium tracking-wide">LIVE</span>
        </div>
      </div>

      {/* 검색 */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이슈 검색..."
          className="w-full rounded-lg border border-slate-800 bg-surface pl-9 pr-4 py-2.5 text-sm outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 placeholder:text-slate-600 transition-colors"
        />
      </div>

      {loading && <IssueSkeletons />}
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {!loading && !error && filtered.length === 0 && (
        <p className="text-slate-500 text-sm py-8 text-center">
          {debouncedQuery ? "검색 결과가 없습니다." : `${statusFilter !== "전체" ? statusFilter + " 상태 " : ""}이슈가 없습니다.`}
        </p>
      )}

      {!loading && (
        <ul className="divide-y divide-slate-800/60">
          {filtered.map((issue) => (
            <li key={issue.issue_id}>
              <Link
                href={`/issues/${issue.issue_id}`}
                className="group flex items-center gap-4 py-4 pl-4 pr-3 rounded-xl bg-surface ring-1 ring-blue-500/10 border-l-2 border-l-blue-500/30 shadow-blue-glow hover:shadow-blue-glow-hover hover:ring-blue-500/25 hover:border-l-blue-500 transition-all duration-300"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium leading-snug truncate group-hover:text-white transition-colors duration-300">
                    {issue.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${STATUS_BADGE[issue.status]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[issue.status]}`} />
                      {issue.status}
                    </span>
                    <span className="text-slate-700">·</span>
                    <span className="text-xs text-slate-500">{relativeTime(issue.updated_at)}</span>
                  </div>
                </div>

                <Sparkline issueId={issue.issue_id} editCount={issue.edit_count} />

                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-slate-300 group-hover:text-white transition-colors duration-300 tabular-nums">
                    {issue.edit_count.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-600">편집</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {!loading && hasMore && (
        <button
          onClick={loadMore}
          disabled={loadingMore}
          className="w-full py-2.5 text-sm text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/10 hover:border-blue-500/60 hover:shadow-[0_0_14px_rgba(59,130,246,0.2)] disabled:opacity-40 transition-all"
        >
          {loadingMore ? "로딩 중..." : "더 보기 ↓"}
        </button>
      )}
    </div>
  );
}
