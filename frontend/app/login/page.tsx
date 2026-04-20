"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">WikiPulse</h1>
          <p className="mt-1 text-sm text-gray-400">계정으로 로그인하세요</p>
        </div>

        <button
          onClick={() => signIn("keycloak", { callbackUrl: "/issues" })}
          className="w-full rounded-lg bg-blue-600 py-3 font-semibold hover:bg-blue-500 transition-colors"
        >
          Keycloak으로 로그인
        </button>

        <p className="mt-4 text-center text-xs text-gray-500">
          로컬 개발 환경에서는 Keycloak 없이 직접 진입합니다
        </p>
      </div>
    </main>
  );
}
