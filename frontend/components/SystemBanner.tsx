"use client";

import { useHealth } from "@/hooks/useHealth";

export function SystemBanner() {
  const health = useHealth();

  if (!health) return null;
  if (health.kafka === "ok" && health.redis === "ok") return null;

  const messages = [];
  if (health.kafka === "unavailable") messages.push("실시간 데이터");
  if (health.redis === "unavailable") messages.push("캐시");

  return (
    <div className="rounded-lg border border-yellow-800 bg-yellow-900/20 px-4 py-2.5 text-sm text-yellow-400 flex items-center gap-2">
      <span>⚠</span>
      <span>{messages.join(", ")} 로딩 중 — 잠시 후 자동으로 복구됩니다.</span>
    </div>
  );
}
