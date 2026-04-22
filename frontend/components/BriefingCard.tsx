"use client";

type Briefing = {
  summary: string;
  key_points: string[];
  created_at: string;
};

type Props = {
  briefing: Briefing | null;
};

function HighlightNumbers({ text }: { text: string }) {
  const parts = text.split(/([\d,]+(?:\.\d+)?(?:\s*(?:회|배|개|명|건|%|억|만|천|초|분|시간))?)/);
  return (
    <>
      {parts.map((part, i) =>
        /^\d/.test(part)
          ? <span key={i} className="text-blue-400 font-semibold">{part}</span>
          : part
      )}
    </>
  );
}

export function BriefingCard({ briefing }: Props) {
  if (!briefing) {
    return (
      <div className="rounded-xl bg-surface ring-1 ring-blue-500/15 shadow-blue-glow p-6">
        <p className="text-sm text-slate-500">AI 브리핑 수신 대기 중...</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-surface ring-1 ring-blue-500/20 shadow-blue-glow-hover p-6 space-y-4">
      <p className="text-sm text-slate-300 leading-relaxed">
        <HighlightNumbers text={briefing.summary} />
      </p>

      <ul className="space-y-2">
        {briefing.key_points.map((point, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-slate-400">
            <span className="text-blue-400 mt-0.5 shrink-0">▸</span>
            <HighlightNumbers text={point} />
          </li>
        ))}
      </ul>

      <p className="text-xs text-slate-600 text-right">
        {new Date(briefing.created_at).toLocaleString("ko-KR")}
      </p>
    </div>
  );
}
