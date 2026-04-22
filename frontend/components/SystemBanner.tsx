"use client";

import { useHealth } from "@/hooks/useHealth";

export function SystemBanner() {
  const health = useHealth();

  if (!health) return null;
  if (health.kafka === "ok" && health.redis === "ok") return null;

  const items = [];
  if (health.kafka === "unavailable") items.push("실시간 데이터");
  if (health.redis === "unavailable") items.push("캐시");

  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-500/50 bg-[#1A1502] px-4 py-3 text-sm text-amber-400">
      <svg className="mt-0.5 shrink-0 w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1a.75.75 0 0 1 .674.418l6.25 12.5A.75.75 0 0 1 14.25 15H1.75a.75.75 0 0 1-.674-1.082l6.25-12.5A.75.75 0 0 1 8 1zm0 5a.75.75 0 0 0-.75.75v3.5a.75.75 0 0 0 1.5 0v-3.5A.75.75 0 0 0 8 6zm0 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
      </svg>
      <span>
        <span className="font-medium">{items.join(", ")} 연결 불안정</span>
        {" — "}잠시 후 자동으로 복구됩니다.
      </span>
    </div>
  );
}
