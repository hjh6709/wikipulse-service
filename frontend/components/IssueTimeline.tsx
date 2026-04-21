"use client";

type TimelineEvent = {
  event_id: string;
  type: "spike" | "reddit" | "sentiment" | "briefing";
  label: string;
  description: string;
  timestamp: string;
};

const TYPE_STYLE: Record<TimelineEvent["type"], { dot: string; label: string }> = {
  spike:     { dot: "bg-indigo-500", label: "text-indigo-400" },
  reddit:    { dot: "bg-orange-500", label: "text-orange-400" },
  sentiment: { dot: "bg-yellow-500", label: "text-yellow-400" },
  briefing:  { dot: "bg-green-500",  label: "text-green-400"  },
};

type Props = {
  events: TimelineEvent[];
};

export function IssueTimeline({ events }: Props) {
  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-sm text-gray-500">
        타임라인 데이터 없음
      </div>
    );
  }

  return (
    <div className="relative space-y-4 pl-4">
      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-800" />
      {events.map((event) => {
        const style = TYPE_STYLE[event.type];
        return (
          <div key={event.event_id} className="relative flex gap-3">
            <span className={`mt-1.5 w-3 h-3 rounded-full shrink-0 ${style.dot}`} />
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${style.label}`}>{event.label}</span>
                <span className="text-xs text-gray-600">
                  {new Date(event.timestamp).toLocaleString("ko-KR")}
                </span>
              </div>
              <p className="text-sm text-gray-400">{event.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
