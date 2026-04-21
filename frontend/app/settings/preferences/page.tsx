"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { fetchPreferences, savePreferences } from "@/lib/api";

const CATEGORIES = ["정치", "경제", "스포츠", "연예", "사회·범죄", "과학·기술"];

export default function PreferencesPage() {
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken ?? "";

  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchPreferences(token)
      .then((data) => setSelected(data.categories))
      .catch(() => {});
  }, [token]);

  function toggle(cat: string) {
    setSelected((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  async function handleSave() {
    if (!token) return;
    setSaving(true);
    try {
      await savePreferences(selected, token);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">개인화</h2>

      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 space-y-4">
        <p className="text-sm text-gray-400">관심 카테고리</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => toggle(cat)}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                selected.includes(cat)
                  ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                  : "border-gray-700 text-gray-400 hover:border-gray-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
          {saved && <span className="text-sm text-green-400">저장됐습니다.</span>}
        </div>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <p className="text-sm text-gray-500">구독 토픽 관리 — 준비 중</p>
      </div>
    </div>
  );
}
