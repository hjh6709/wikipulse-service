import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <p className="text-6xl font-bold text-stone-700">404</p>
        <h1 className="text-xl font-semibold">페이지를 찾을 수 없습니다</h1>
        <p className="text-sm text-slate-400">요청하신 페이지가 존재하지 않거나 이동됐습니다.</p>
        <Link
          href="/"
          className="inline-block mt-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium hover:bg-blue-500 transition-colors"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </main>
  );
}
