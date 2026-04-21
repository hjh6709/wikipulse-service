"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { savePreferences } from "@/lib/api";

const CATEGORIES = ["정치", "경제", "스포츠", "연예", "사회·범죄", "과학·기술"];

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken ?? "";

  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function toggle(cat: string) {
    setSelected((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  async function handleStart() {
    if (!token) return;
    setSaving(true);
    try {
      await savePreferences(selected, token);
    } finally {
      setSaving(false);
    }
    router.push("/issues");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">WikiPulse에 오신 것을 환영합니다</h1>
          <p className="text-sm text-gray-400">관심 있는 카테고리를 선택하면 맞춤 이슈를 먼저 보여드립니다.</p>
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 space-y-4">
          <p className="text-sm text-gray-400">관심 카테고리 <span className="text-gray-600">(선택 사항)</span></p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => toggle(cat)}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  selected.includes(cat)
                    ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                    : "border-gray-700 text-gray-400 hover:border-gray-600"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleStart}
          disabled={saving}
          className="w-full rounded-lg bg-indigo-600 py-3 text-sm font-medium hover:bg-indigo-500 disabled:opacity-50 transition-colors"
        >
          {saving ? "저장 중..." : "시작하기"}
        </button>

        <button
          onClick={() => router.push("/issues")}
          className="w-full text-sm text-gray-600 hover:text-gray-400 transition-colors"
        >
          건너뛰기
        </button>
      </div>
    </div>
  );
}
