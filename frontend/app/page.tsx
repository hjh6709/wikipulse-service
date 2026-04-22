import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Issue = {
  issue_id: string;
  title: string;
  edit_count: number;
  spike_score: number;
  status: "발생" | "확산" | "정점" | "소강";
};

const STATUS_DOT: Record<Issue["status"], string> = {
  발생: "bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.9)]",
  확산: "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.9)]",
  정점: "bg-orange-400 shadow-[0_0_6px_rgba(251,146,60,0.9)]",
  소강: "bg-slate-500",
};

const STATUS_TEXT: Record<Issue["status"], string> = {
  발생: "text-sky-400",
  확산: "text-blue-500",
  정점: "text-orange-400",
  소강: "text-slate-500",
};

function Sparkline({ issueId, editCount }: { issueId: string; editCount: number }) {
  let h = 0;
  for (const c of issueId) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  const pts: number[] = [];
  let v = Math.max(1, editCount * 0.3);
  for (let i = 0; i < 6; i++) {
    h = (h * 1103515245 + 12345) & 0x7fff;
    v = Math.max(1, v + (h / 0x7fff - 0.45) * editCount * 0.4);
    pts.push(v);
  }
  pts.push(editCount);
  const max = Math.max(...pts), min = Math.min(...pts);
  const range = max - min || 1;
  const W = 48, H = 18;
  const pathD = pts
    .map((val, i) => `${i === 0 ? "M" : "L"}${(i / (pts.length - 1)) * W},${H - ((val - min) / range) * (H - 2) - 1}`)
    .join(" ");
  return (
    <svg width={W} height={H} className="shrink-0 opacity-50">
      <path d={pathD} fill="none" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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
    <main className="min-h-screen bg-navy text-white">
      <div className="max-w-2xl mx-auto px-4 py-24 space-y-20">

        {/* Hero */}
        <section className="space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-start whitespace-nowrap">
              <h1 className="text-6xl font-bold tracking-tight font-display">WikiPulse</h1>
              <span className="relative flex h-2 w-2 ml-2 mt-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF4848] opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF4848] shadow-[0_0_6px_#FF4848]" />
              </span>
            </div>
            <p className="text-lg text-slate-400">지금 Wikipedia에서 무슨 일이 벌어지고 있나요?</p>
          </div>
          <Link
            href={isLoggedIn ? "/issues" : "/login"}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-700 to-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-blue-btn hover:shadow-blue-btn-hover hover:from-blue-600 hover:to-blue-400 transition-all"
          >
            {isLoggedIn ? "Trend 보기" : "시작하기"}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        </section>

        {/* 이슈 미리보기 */}
        <section className="space-y-0">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-xs font-medium text-slate-500 uppercase tracking-widest">지금 주목받는 이슈</h2>
            <Link href={isLoggedIn ? "/issues" : "/login"} className="text-xs text-blue-400 hover:text-blue-300 transition-colors duration-300">
              전체 보기 →
            </Link>
          </div>

          {issues.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-600">
              데이터 연동 전 준비 중입니다.
            </div>
          ) : (
            <ul className="space-y-2 pt-2">
              {issues.map((issue) => (
                <li key={issue.issue_id}>
                  <Link
                    href={isLoggedIn ? `/issues/${issue.issue_id}` : "/login"}
                    className="group flex items-center gap-4 rounded-xl bg-surface border border-blue-500/15 border-l-2 border-l-blue-500/40 px-4 py-4 shadow-blue-glow hover:shadow-blue-glow-hover hover:border-blue-500/30 hover:border-l-blue-500 transition-all duration-300"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-medium truncate group-hover:text-white transition-colors duration-300">
                        {issue.title}
                      </p>
                      <span className={`inline-flex items-center gap-1.5 mt-1.5 text-xs font-medium ${STATUS_TEXT[issue.status]}`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[issue.status]}`} />
                        {issue.status}
                      </span>
                    </div>
                    <Sparkline issueId={issue.issue_id} editCount={issue.edit_count} />
                    <div className="text-right shrink-0">
                      <p className="text-xl font-extrabold text-blue-400 group-hover:text-blue-300 transition-colors duration-300 tabular-nums">
                        {issue.edit_count.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-600">편집</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {issues.length > 0 && (
            <div className="flex justify-center pt-4">
              <Link
                href={isLoggedIn ? "/issues" : "/login"}
                className="px-6 py-2 text-sm text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/10 hover:border-blue-500/60 hover:shadow-[0_0_14px_rgba(59,130,246,0.2)] transition-all"
              >
                더보기 ↓
              </Link>
            </div>
          )}

          {!isLoggedIn && (
            <p className="text-xs text-slate-600 text-center pt-3">
              전체 이슈 및 실시간 분석은 로그인 후 이용 가능합니다
            </p>
          )}
        </section>

        {/* 기능 소개 */}
        <section className="grid grid-cols-3 gap-px bg-slate-800 border border-slate-800 rounded-xl overflow-hidden">
          {[
            {
              icon: (
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              ),
              label: "실시간 감지",
              desc: "뉴스보다 빠르게",
            },
            {
              icon: (
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
                </svg>
              ),
              label: "AI 브리핑",
              desc: "Gemini 자동 요약",
            },
            {
              icon: (
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25z" />
                </svg>
              ),
              label: "여론 분석",
              desc: "Reddit 감성 분포",
            },
          ].map((f) => (
            <div key={f.label} className="bg-surface px-5 py-4 space-y-2">
              {f.icon}
              <p className="text-sm font-medium">{f.label}</p>
              <p className="text-xs text-slate-500">{f.desc}</p>
            </div>
          ))}
        </section>

      </div>
    </main>
  );
}
