"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { saveAlertSettings, type AlertChannel } from "@/lib/api";

const CHANNEL_ICONS: Record<AlertChannel, React.ReactNode> = {
  discord: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.032.054a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  ),
  email: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  ),
};

const CHANNELS: { id: AlertChannel; label: string }[] = [
  { id: "discord", label: "Discord" },
  { id: "email", label: "이메일" },
];

export default function AlertsPage() {
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken ?? "";

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
      await saveAlertSettings({ issue_id: "", threshold, channels }, token);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">알림 설정</h2>

      {saved && (
        <div className="flex items-center gap-3 rounded-lg border border-green-800/50 bg-green-900/20 px-4 py-3 text-sm text-green-400">
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm3.47 5.28-4 4.5a.75.75 0 0 1-1.06.06l-2-2a.75.75 0 1 1 1.06-1.06l1.44 1.44 3.48-3.91a.75.75 0 1 1 1.12 1z" />
          </svg>
          <span>알림이 등록됐습니다.</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-800/50 bg-red-900/20 px-4 py-3 text-sm text-red-400">
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zM7.25 4.75a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0v-3.5zM8 11a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-xl border border-stone-800 bg-stone-900 p-6 space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-medium text-stone-300">편집 횟수 기준</label>
          <div className="flex gap-2">
            {[10, 20, 50, 100].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setThreshold(preset)}
                className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                  threshold === preset
                    ? "border-amber-500 bg-amber-500/10 text-amber-500 font-medium"
                    : "border-stone-700 text-stone-500 hover:border-stone-600 hover:text-stone-300"
                }`}
              >
                {preset}회
              </button>
            ))}
          </div>
          <p className="text-sm text-stone-300">선택한 횟수를 넘어서면 즉시 알림을 보냅니다.</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-300">알림 채널</label>
          <div className="flex gap-2">
            {CHANNELS.map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => toggleChannel(ch.id)}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors ${
                  channels.includes(ch.id)
                    ? "border-amber-500 bg-amber-500/10 text-amber-500"
                    : "border-stone-700 text-stone-400 hover:border-stone-600"
                }`}
              >
                {CHANNEL_ICONS[ch.id]}
                {ch.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium hover:bg-amber-500 disabled:opacity-50 transition-colors"
        >
          {saving ? "저장 중..." : "알림 등록"}
        </button>
      </form>
    </div>
  );
}
