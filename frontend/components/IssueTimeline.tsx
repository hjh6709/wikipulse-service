"use client";

type TimelineEvent = {
  event_id: string;
  type: "spike" | "reddit" | "sentiment" | "briefing";
  label: string;
  description: string;
  timestamp: string;
};

const TYPE_STYLE: Record<TimelineEvent["type"], { dot: string; badge: string; icon: React.ReactNode; fallback: string }> = {
  spike: {
    dot: "text-blue-400 ring-1 ring-blue-500/40 shadow-[0_0_8px_rgba(59,130,246,0.3)]",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    fallback: "편집 폭증",
    icon: (
      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 1l1.5 3.5H11L8.25 6.75l1 3.75L6 8.25 2.75 10.5l1-3.75L1 4.5h3.5L6 1z" />
      </svg>
    ),
  },
  reddit: {
    dot: "text-orange-400 ring-1 ring-orange-500/40 shadow-[0_0_8px_rgba(249,115,22,0.25)]",
    badge: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    fallback: "Reddit 수집",
    icon: (
      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="6" r="5" />
        <circle cx="4" cy="5.5" r="0.5" fill="currentColor" />
        <circle cx="8" cy="5.5" r="0.5" fill="currentColor" />
        <path d="M4 8c.5.5 3.5.5 4 0" />
      </svg>
    ),
  },
  sentiment: {
    dot: "text-yellow-400 ring-1 ring-yellow-500/40 shadow-[0_0_8px_rgba(234,179,8,0.25)]",
    badge: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    fallback: "감성 분석",
    icon: (
      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="6" r="5" />
        <circle cx="4" cy="4.5" r="0.5" fill="currentColor" />
        <circle cx="8" cy="4.5" r="0.5" fill="currentColor" />
        <path d="M3.5 7.5c.5 1 4.5 1 5 0" />
      </svg>
    ),
  },
  briefing: {
    dot: "text-green-400 ring-1 ring-green-500/40 shadow-[0_0_8px_rgba(34,197,94,0.25)]",
    badge: "bg-green-500/10 text-green-400 border-green-500/30",
    fallback: "AI 브리핑",
    icon: (
      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <rect x="1.5" y="1.5" width="9" height="9" rx="1.5" />
        <path d="M3.5 4.5h5M3.5 6.5h3.5" />
      </svg>
    ),
  },
};

type Props = {
  events: TimelineEvent[];
};

export function IssueTimeline({ events }: Props) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-28 gap-2 text-slate-500">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
        </svg>
        <span className="text-sm">타임라인 데이터 없음</span>
      </div>
    );
  }

  return (
    <div className="relative space-y-6 pl-6">
      {/* 그라데이션 커넥팅 라인 */}
      <div
        className="absolute left-[9px] top-3 bottom-3 w-px"
        style={{ background: "linear-gradient(to bottom, rgba(59,130,246,0.4), rgba(59,130,246,0.05))" }}
      />
      {events.map((event) => {
        const style = TYPE_STYLE[event.type];
        return (
          <div key={event.event_id} className="relative flex gap-4">
            <span className={`mt-0.5 w-5 h-5 rounded-full shrink-0 flex items-center justify-center ${style.dot}`}>
              {style.icon}
            </span>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${style.badge}`}>
                  {event.label || style.fallback}
                </span>
                <span className="text-xs text-slate-500 shrink-0">
                  {new Date(event.timestamp).toLocaleString("ko-KR")}
                </span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">{event.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
