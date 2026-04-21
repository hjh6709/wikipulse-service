import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Issue = {
  issue_id: string;
  title: string;
  edit_count: number;
  spike_score: number;
};

async function getPreviewIssues(): Promise<Issue[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/issues?preview=true`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function Home() {
  const [issues, session] = await Promise.all([getPreviewIssues(), getServerSession(authOptions)]);
  const isLoggedIn = !!session;

  return (
    <main className="min-h-screen bg-stone-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-24 space-y-20">

        {/* Hero */}
        <section className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-6xl font-bold tracking-tight font-display">WikiPulse</h1>
            <p className="text-lg text-stone-400">지금 Wikipedia에서 무슨 일이 벌어지고 있나요?</p>
          </div>
          <Link
            href={isLoggedIn ? "/issues" : "/login"}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold hover:bg-amber-500 transition-colors"
          >
            {isLoggedIn ? "Trend 보기" : "시작하기"}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        </section>

        {/* 이슈 미리보기 */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-stone-400 uppercase tracking-wider">지금 주목받는 이슈</h2>
            <Link href={isLoggedIn ? "/issues" : "/login"} className="text-sm text-amber-500 hover:text-amber-400 transition-colors">
              전체 보기 →
            </Link>
          </div>

          {issues.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-800 p-8 text-center text-sm text-stone-500">
              데이터 연동 전 준비 중입니다.
            </div>
          ) : (
            <ul className="space-y-2">
              {issues.map((issue) => (
                <li key={issue.issue_id}>
                  <Link
                    href={isLoggedIn ? `/issues/${issue.issue_id}` : "/login"}
                    className="group flex items-center gap-4 rounded-xl border border-stone-800 border-l-4 border-l-blue-500/60 bg-stone-900 p-4 hover:bg-stone-800/60 hover:border-l-blue-500 transition-all"
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-semibold truncate group-hover:text-white transition-colors">
                        {issue.title}
                      </p>
                      <p className="text-sm text-stone-400">{issue.edit_count}회 편집</p>
                    </div>
                    <svg
                      className="w-4 h-4 text-stone-700 group-hover:text-stone-400 transition-colors shrink-0"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {!isLoggedIn && (
            <p className="text-sm text-stone-500 text-center pt-1">
              실시간 분석 및 전체 이슈는 로그인 후 이용할 수 있습니다
            </p>
          )}
        </section>

        {/* 기능 소개 */}
        <section className="border-t border-stone-800 pt-10">
          <div className="grid grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                ),
                label: "실시간 감지",
                desc: "뉴스보다 빠르게",
              },
              {
                icon: (
                  <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
                  </svg>
                ),
                label: "AI 브리핑",
                desc: "Gemini 자동 요약",
              },
              {
                icon: (
                  <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25z" />
                  </svg>
                ),
                label: "여론 분석",
                desc: "Reddit 감성 분포",
              },
            ].map((f) => (
              <div key={f.label} className="space-y-2">
                {f.icon}
                <p className="text-sm font-semibold">{f.label}</p>
                <p className="text-sm text-stone-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
