"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { fetchArchivedIssues, type Issue } from "@/lib/api";

type SortMode = "latest" | "edits";
type PeriodFilter = "all" | "3m" | "6m" | "1y";

const PERIOD_LABELS: Record<PeriodFilter, string> = {
  all: "전체",
  "3m": "3개월",
  "6m": "6개월",
  "1y": "1년",
};

const SORT_LABELS: Record<SortMode, string> = {
  latest: "최신순",
  edits: "편집 많은순",
};

const PAGE_SIZE = 3;

function getPeriodCutoff(period: PeriodFilter): Date | null {
  if (period === "all") return null;
  const d = new Date();
  if (period === "3m") d.setMonth(d.getMonth() - 3);
  if (period === "6m") d.setMonth(d.getMonth() - 6);
  if (period === "1y") d.setFullYear(d.getFullYear() - 1);
  return d;
}

function groupByMonth(issues: Issue[]): { label: string; key: string; items: Issue[] }[] {
  const map = new Map<string, Issue[]>();
  for (const issue of issues) {
    const d = new Date(issue.updated_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(issue);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, items]) => {
      const [y, m] = key.split("-");
      return { key, label: `${y}년 ${Number(m)}월`, items };
    });
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
  const W = 48, H = 18;
  const pathD = pts
    .map((val, i) => `${i === 0 ? "M" : "L"}${(i / (pts.length - 1)) * W},${H - ((val - min) / range) * (H - 2) - 1}`)
    .join(" ");
  return (
    <svg width={W} height={H} className="shrink-0 opacity-50">
      <path d={pathD} fill="none" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HistorySkeletons() {
  return (
    <div className="space-y-6">
      {[...Array(2)].map((_, g) => (
        <div key={g} className="space-y-2">
          <div className="h-5 w-28 rounded bg-slate-800 animate-pulse" />
          <ul className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <li key={i} className="rounded-xl bg-surface ring-1 ring-blue-500/10 border-l-2 border-l-blue-500/20 px-4 py-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/3 rounded bg-slate-700" />
                    <div className="h-3 w-1/3 rounded bg-slate-800" />
                  </div>
                  <div className="h-5 w-12 rounded bg-slate-800 opacity-50" />
                  <div className="h-3 w-16 rounded bg-slate-800" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function IssueCard({ issue }: { issue: Issue }) {
  return (
    <Link
      href={`/issues/${issue.issue_id}`}
      className="group flex items-center gap-4 rounded-xl bg-surface ring-1 ring-blue-500/10 border-l-2 border-l-blue-500/40 px-4 py-4 shadow-blue-glow hover:shadow-blue-glow-hover hover:ring-blue-500/25 hover:border-l-blue-500 transition-all duration-300"
    >
      <div className="flex-1 min-w-0 space-y-1.5">
        <p className="text-sm font-semibold leading-snug truncate group-hover:text-white transition-colors duration-300">
          {issue.title}
        </p>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
          </svg>
          {issue.edit_count.toLocaleString()}회 편집
        </div>
      </div>
      <Sparkline issueId={issue.issue_id} editCount={issue.edit_count} />
      <div className="text-right shrink-0 space-y-0.5">
        <p className="text-xs text-slate-500">
          {new Date(issue.updated_at).toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}
        </p>
        <svg
          className="w-4 h-4 text-slate-700 group-hover:text-slate-400 transition-colors duration-300 ml-auto"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </div>
    </Link>
  );
}

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken ?? "";

  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("latest");
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

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

  // 필터/정렬이 바뀌면 더보기 상태 초기화
  useEffect(() => { setExpanded(new Set()); }, [sort, period, debouncedQuery]);

  const filtered = useMemo(() => {
    const cutoff = getPeriodCutoff(period);
    let result = cutoff
      ? issues.filter((i) => new Date(i.updated_at) >= cutoff)
      : issues;
    if (sort === "latest") {
      result = [...result].sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    } else {
      result = [...result].sort((a, b) => b.edit_count - a.edit_count);
    }
    return result;
  }, [issues, period, sort]);

  const groups = useMemo(
    () => (sort === "latest" ? groupByMonth(filtered) : [{ key: "_all", label: "전체", items: filtered }]),
    [filtered, sort]
  );

  return (
    <main className="mx-auto max-w-2xl p-8 space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold font-display">Archive</h1>
          {!loading && (
            <span className="text-sm font-medium text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full">
              {filtered.length}건
            </span>
          )}
        </div>
        <p className="text-sm text-slate-400">소강 상태로 마무리된 이슈를 모아둔 곳입니다.</p>
      </div>

      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"
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

      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-1">
          {(Object.keys(PERIOD_LABELS) as PeriodFilter[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                period === p
                  ? "border-blue-500 bg-blue-500/10 text-blue-400 font-medium"
                  : "border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600"
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {(Object.keys(SORT_LABELS) as SortMode[]).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                sort === s
                  ? "border-blue-500 bg-blue-500/10 text-blue-400 font-medium"
                  : "border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600"
              }`}
            >
              {SORT_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {loading && <HistorySkeletons />}

      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
          <p className="text-sm">
            {debouncedQuery ? "검색 결과가 없습니다." : "해당 기간에 히스토리가 없습니다."}
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="space-y-8">
          {groups.map((group) => {
            const isExpanded = expanded.has(group.key);
            const visible = isExpanded ? group.items : group.items.slice(0, PAGE_SIZE);
            const remaining = group.items.length - PAGE_SIZE;

            return (
              <div key={group.key} className="space-y-2">
                {sort === "latest" && (
                  <div className="flex items-center gap-2 pb-1">
                    <span className="text-sm font-semibold text-slate-300">{group.label}</span>
                    <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                      {group.items.length}건
                    </span>
                  </div>
                )}

                <ul className="space-y-2">
                  {visible.map((issue) => (
                    <li key={issue.issue_id}>
                      <IssueCard issue={issue} />
                    </li>
                  ))}
                </ul>

                {!isExpanded && remaining > 0 && (
                  <button
                    onClick={() => setExpanded((prev) => new Set([...prev, group.key]))}
                    className="w-full py-2.5 text-sm text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/10 hover:border-blue-500/60 hover:shadow-[0_0_14px_rgba(59,130,246,0.2)] transition-all"
                  >
                    {remaining}건 더 보기 ↓
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
