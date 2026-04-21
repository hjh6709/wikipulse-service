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
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
        <p className="text-sm text-gray-500">AI 브리핑 수신 대기 중...</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-indigo-400">AI 브리핑</h3>
        <span className="text-xs text-gray-600">
          {new Date(briefing.created_at).toLocaleString("ko-KR")}
        </span>
      </div>

      <p className="text-sm text-gray-300 leading-relaxed">{briefing.summary}</p>

      <ul className="space-y-1.5">
        {briefing.key_points.map((point, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
            <span className="text-indigo-500 mt-0.5">•</span>
            {point}
          </li>
        ))}
      </ul>
    </div>
  );
}
