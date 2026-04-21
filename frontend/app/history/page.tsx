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

function HistorySkeletons() {
  return (
    <div className="space-y-6">
      {[...Array(2)].map((_, g) => (
        <div key={g} className="space-y-2">
          <div className="h-5 w-28 rounded bg-stone-800 animate-pulse" />
          <ul className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <li key={i} className="rounded-xl border border-stone-800 bg-stone-900 p-4 animate-pulse">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/3 rounded bg-stone-700" />
                    <div className="h-3 w-1/3 rounded bg-stone-800" />
                  </div>
                  <div className="shrink-0 space-y-2 text-right">
                    <div className="h-3 w-20 rounded bg-stone-800" />
                  </div>
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
      className="group flex items-center gap-4 rounded-xl border border-stone-800 bg-stone-900 p-4 hover:border-amber-500/50 hover:bg-stone-800/60 transition-all"
    >
      <div className="flex-1 min-w-0 space-y-1.5">
        <p className="text-sm font-semibold leading-snug truncate group-hover:text-white transition-colors">
          {issue.title}
        </p>
        <div className="flex items-center gap-1 text-sm text-stone-400">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
          </svg>
          {issue.edit_count}회 편집
        </div>
      </div>
      <span className="shrink-0 text-sm text-stone-400">
        {new Date(issue.updated_at).toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}
      </span>
      <svg
        className="w-4 h-4 text-stone-700 group-hover:text-stone-400 transition-colors shrink-0"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
      </svg>
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
            <span className="text-sm font-medium text-stone-400 bg-stone-800 px-2.5 py-1 rounded-full">
              {filtered.length}건
            </span>
          )}
        </div>
        <p className="text-sm text-stone-400">소강 상태로 마무리된 이슈를 모아둔 곳입니다.</p>
      </div>

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

      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-1">
          {(Object.keys(PERIOD_LABELS) as PeriodFilter[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                period === p
                  ? "border-amber-500 bg-amber-500/10 text-amber-500 font-medium"
                  : "border-stone-700 text-stone-500 hover:text-stone-300 hover:border-stone-600"
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
                  ? "border-amber-500 bg-amber-500/10 text-amber-500 font-medium"
                  : "border-stone-700 text-stone-500 hover:text-stone-300 hover:border-stone-600"
              }`}
            >
              {SORT_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {loading && <HistorySkeletons />}

      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-stone-500">
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
                    <span className="text-sm font-semibold text-stone-300">{group.label}</span>
                    <span className="text-xs text-stone-500 bg-stone-800 px-2 py-0.5 rounded-full">
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
                    className="w-full rounded-lg border border-stone-800 py-2.5 text-sm text-stone-400 hover:border-stone-700 hover:text-white transition-colors"
                  >
                    {remaining}건 더 보기
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
