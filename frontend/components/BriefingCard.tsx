"use client";

type Briefing = {
  summary: string;
  key_points: string[];
  created_at: string;
};

type Props = {
  briefing: Briefing | null;
};

export function BriefingCard({ briefing }: Props) {
  if (!briefing) {
    return (
      <div className="rounded-xl border border-stone-800 bg-stone-900 p-5">
        <p className="text-sm text-stone-400">AI 브리핑 수신 대기 중...</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-stone-800 bg-stone-900 p-5 space-y-4">
      <div className="flex items-center justify-end">
        <span className="text-sm text-stone-300">
          {new Date(briefing.created_at).toLocaleString("ko-KR")}
        </span>
      </div>

      <p className="text-sm text-stone-300 leading-relaxed">{briefing.summary}</p>

      <ul className="space-y-1.5">
        {briefing.key_points.map((point, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-stone-400">
            <span className="text-amber-500 mt-0.5">•</span>
            {point}
          </li>
        ))}
      </ul>
    </div>
  );
}
