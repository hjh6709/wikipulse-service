"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { saveAlertSettings, type AlertChannel } from "@/lib/api";

const CHANNELS: { id: AlertChannel; label: string }[] = [
  { id: "discord", label: "Discord" },
  { id: "email", label: "이메일" },
];

export default function AlertsPage() {
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken ?? "";

  const [issueId, setIssueId] = useState("");
  const [threshold, setThreshold] = useState(20);
  const [channels, setChannels] = useState<AlertChannel[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function toggleChannel(ch: AlertChannel) {
    setChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (channels.length === 0) {
      setError("알림 채널을 하나 이상 선택하세요.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await saveAlertSettings({ issue_id: issueId, threshold, channels }, token);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">알림 설정</h2>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-gray-800 bg-gray-900 p-6 space-y-5"
      >
        <div className="space-y-1">
          <label className="text-xs text-gray-500">이슈 ID</label>
          <input
            required
            value={issueId}
            onChange={(e) => setIssueId(e.target.value)}
            placeholder="예: issue-1"
            className="w-full rounded-lg bg-gray-800 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-gray-500">알림 임계값 (edit_count)</label>
          <input
            type="number"
            min={1}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-40 rounded-lg bg-gray-800 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-xs text-gray-600">편집 횟수가 이 값을 초과하면 알림을 보냅니다.</p>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-gray-500">알림 채널</label>
          <div className="flex gap-3">
            {CHANNELS.map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => toggleChannel(ch.id)}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  channels.includes(ch.id)
                    ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                    : "border-gray-700 text-gray-400 hover:border-gray-600"
                }`}
              >
                {ch.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            {saving ? "저장 중..." : "알림 등록"}
          </button>
          {saved && <span className="text-sm text-green-400">등록됐습니다.</span>}
        </div>
      </form>
    </div>
  );
}
