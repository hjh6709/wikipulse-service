"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { fetchIssues, type Issue } from "@/lib/api";

export default function IssueList() {
  const { data: session, status } = useSession();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    const token = (session as { accessToken?: string } | null)?.accessToken;
    fetchIssues(token)
      .then(setIssues)
      .catch(() => setError("이슈를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [session, status]);

  if (loading) return <p className="text-gray-400">로딩 중...</p>;
  if (error) return <p className="text-red-400">{error}</p>;
  if (issues.length === 0) return <p className="text-gray-500">이슈가 없습니다.</p>;

  return (
    <ul className="space-y-3">
      {issues.map((issue) => (
        <li key={issue.issue_id}>
          <Link
            href={`/issues/${issue.issue_id}`}
            className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900 p-4 hover:border-blue-600 transition-colors"
          >
            <div>
              <p className="font-medium">{issue.title}</p>
              <p className="text-xs text-gray-500 mt-1">spike: {issue.spike_score}</p>
            </div>
            <span className="text-sm text-gray-400">편집 {issue.edit_count}회</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
