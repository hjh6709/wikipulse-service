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
    dot: "bg-amber-500",
    badge: "bg-amber-500/10 text-amber-500 border-amber-500/30",
    fallback: "편집 폭증",
    icon: (
      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
        <path d="M6 1l1.5 3.5H11L8.25 6.75l1 3.75L6 8.25 2.75 10.5l1-3.75L1 4.5h3.5L6 1z" />
      </svg>
    ),
  },
  reddit: {
    dot: "bg-orange-500",
    badge: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    fallback: "Reddit 수집",
    icon: (
      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
        <path d="M6 1a5 5 0 1 0 0 10A5 5 0 0 0 6 1zm2.5 5.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0zm-4 0a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0zM6 8.5c-.83 0-1.5-.34-1.5-.75h3c0 .41-.67.75-1.5.75z" />
      </svg>
    ),
  },
  sentiment: {
    dot: "bg-yellow-500",
    badge: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    fallback: "감성 분석",
    icon: (
      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
        <path d="M6 1a5 5 0 1 0 0 10A5 5 0 0 0 6 1zM4 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM3.5 7.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1 0-1z" />
      </svg>
    ),
  },
  briefing: {
    dot: "bg-green-500",
    badge: "bg-green-500/10 text-green-400 border-green-500/30",
    fallback: "AI 브리핑",
    icon: (
      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
        <path d="M6 1a5 5 0 1 0 0 10A5 5 0 0 0 6 1zM3 5.5h6M3 7.5h4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" fill="none" />
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
      <div className="flex flex-col items-center justify-center h-28 gap-2 text-stone-400">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
        </svg>
        <span className="text-sm">타임라인 데이터 없음</span>
      </div>
    );
  }

  return (
    <div className="relative space-y-5 pl-6">
      <div className="absolute left-[9px] top-3 bottom-3 w-px bg-stone-800" />
      {events.map((event) => {
        const style = TYPE_STYLE[event.type];
        return (
          <div key={event.event_id} className="relative flex gap-4">
            <span className={`mt-0.5 w-5 h-5 rounded-full shrink-0 flex items-center justify-center ring-2 ring-stone-950 text-white ${style.dot}`}>
              {style.icon}
            </span>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${style.badge}`}>
                  {event.label || style.fallback}
                </span>
                <span className="text-sm text-stone-300 shrink-0">
                  {new Date(event.timestamp).toLocaleString("ko-KR")}
                </span>
              </div>
              <p className="text-sm text-stone-400 leading-relaxed">{event.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
