import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold tracking-tight">WikiPulse</h1>
      <p className="text-gray-400">Wikipedia 편집 폭증 실시간 대시보드</p>
      <Link
        href="/login"
        className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500 transition-colors"
      >
        로그인
      </Link>
    </main>
  );
}
