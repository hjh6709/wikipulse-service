"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchIssues, type Issue } from "@/lib/api";

export default function IssueList() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIssues()
      .then(setIssues)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-400">로딩 중...</p>;

  return (
    <ul className="space-y-3">
      {issues.map((issue) => (
        <li key={issue.issue_id}>
          <Link
            href={`/issues/${issue.issue_id}`}
            className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900 p-4 hover:border-blue-600 transition-colors"
          >
            <span className="font-medium">{issue.title}</span>
            <span className="text-sm text-gray-400">편집 {issue.edit_count}회</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
