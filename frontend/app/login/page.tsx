"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleMockLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { username, password, callbackUrl: "/issues", redirect: false });
    if (res?.error) setError("로그인에 실패했습니다. 다시 시도해주세요.");
    else if (res?.url) window.location.href = res.url;
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm rounded-2xl border border-stone-800 bg-stone-900 p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">WikiPulse</h1>
          <p className="mt-1 text-sm text-stone-400">계정으로 로그인하세요</p>
        </div>

        <form onSubmit={handleMockLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm text-stone-300">Username</label>
            <input
              type="text"
              placeholder="아무 값이나 입력하세요"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg bg-stone-800 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-stone-300">Password</label>
            <input
              type="password"
              placeholder="아무 값이나 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-stone-800 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          {error && (
            <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !username}
            className="w-full rounded-lg bg-amber-600 py-3 font-semibold hover:bg-amber-500 transition-colors disabled:opacity-50"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        {process.env.NEXT_PUBLIC_KEYCLOAK_ENABLED === "true" && (
          <button
            onClick={() => signIn("keycloak", { callbackUrl: "/issues" })}
            className="mt-3 w-full rounded-lg border border-stone-700 py-3 text-sm hover:bg-stone-800 transition-colors"
          >
            Keycloak으로 로그인
          </button>
        )}
      </div>
    </main>
  );
}
