import Link from "next/link";

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
  const issues = await getPreviewIssues();

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-20 space-y-16">

        <section className="space-y-4 text-center">
          <h1 className="text-5xl font-bold tracking-tight">WikiPulse</h1>
          <p className="text-lg text-gray-400">
            Wikipedia 편집 폭증을 실시간으로 감지하고<br />
            AI가 지금 무슨 일이 벌어지고 있는지 알려줍니다
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/login"
              className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold hover:bg-indigo-500 transition-colors"
            >
              시작하기
            </Link>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-400">지금 주목받는 이슈</h2>
            <Link href="/login" className="text-xs text-indigo-400 hover:text-indigo-300">
              전체 보기 →
            </Link>
          </div>

          {issues.length === 0 ? (
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center text-sm text-gray-500">
              이슈 데이터를 불러오는 중...
            </div>
          ) : (
            <div className="space-y-3">
              {issues.map((issue) => (
                <div
                  key={issue.issue_id}
                  className="rounded-xl border border-gray-800 bg-gray-900 p-4 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{issue.title}</p>
                    <p className="text-xs text-gray-500">편집 횟수 {issue.edit_count}회</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-xs text-indigo-400">
                      스파이크 {Math.round(issue.spike_score * 100)}%
                    </p>
                    <Link
                      href="/login"
                      className="text-xs text-gray-600 hover:text-gray-400"
                    >
                      자세히 보기 →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-center text-xs text-gray-600 pt-2">
            전체 이슈 및 실시간 분석은 로그인 후 이용 가능합니다
          </p>
        </section>

        <section className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: "실시간 감지", desc: "뉴스보다 빠르게" },
            { label: "AI 브리핑", desc: "Gemini 자동 요약" },
            { label: "여론 분석", desc: "Reddit 감성 분포" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-gray-800 bg-gray-900 p-4 space-y-1">
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
          ))}
        </section>

      </div>
    </main>
  );
}
