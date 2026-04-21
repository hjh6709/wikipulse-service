"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { fetchMe, patchMe, type UserSettings } from "@/lib/api";

export default function AccountPage() {
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken ?? "";

  const [user, setUser] = useState<UserSettings | null>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchMe(token).then((u) => {
      setUser(u);
      setUsername(u.username);
      setEmail(u.email);
    }).catch(() => {});
  }, [token]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      const updated = await patchMe({ username, email }, token);
      setUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">계정 정보</h2>

      <form onSubmit={handleSave} className="rounded-xl border border-stone-800 bg-stone-900 p-6 space-y-4">
        <div className="space-y-1">
          <label className="text-sm text-stone-300">이름</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg bg-stone-800 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-stone-300">이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg bg-stone-800 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving || !user}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium hover:bg-amber-500 disabled:opacity-50 transition-colors"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
          {saved && <span className="text-sm text-green-400">저장됐습니다.</span>}
        </div>
      </form>

      <div className="rounded-xl border border-stone-800 bg-stone-900 p-6">
        <p className="text-sm text-stone-400">비밀번호 변경 — Keycloak 연동 후 제공 예정</p>
      </div>
    </div>
  );
}
