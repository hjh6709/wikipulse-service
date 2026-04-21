"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { BriefingCard } from "@/components/BriefingCard";
import { CommentFeed } from "@/components/CommentFeed";
import { IssueTimeline } from "@/components/IssueTimeline";
import { SentimentChart } from "@/components/SentimentChart";
import { SpikeChart } from "@/components/SpikeChart";
import { SystemBanner } from "@/components/SystemBanner";
import { useWebSocket } from "@/hooks/useWebSocket";
import { fetchIssue, type Issue } from "@/lib/api";

type Briefing = { summary: string; key_points: string[]; created_at: string };
type SpikeData = { edit_count: number; triggered_at?: string };
type SentimentData = { sentiment: string; sentiment_score: number };
type CommentData = { comment_id?: string; author: string; body: string; score: number; sentiment: "positive" | "negative" | "neutral"; created_at: string };
type TimelineEvent = { event_id: string; type: "spike" | "reddit" | "sentiment" | "briefing"; label: string; description: string; timestamp: string };

const STATUS_STYLE: Record<Issue["status"], string> = {
  발생: "bg-sky-500/20 text-sky-400",
  확산: "bg-amber-500/20 text-amber-400",
  정점: "bg-red-500/20 text-red-400",
  소강: "bg-stone-500/20 text-stone-400",
};

export default function IssuePage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [issue, setIssue] = useState<Issue | null>(null);

  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [spikeData, setSpikeData] = useState<SpikeData | null>(null);
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);
  const [commentData, setCommentData] = useState<CommentData | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    if (status === "loading" || !session?.accessToken) return;
    const token = (session as { accessToken?: string }).accessToken;
    fetchIssue(params.id, token).then(setIssue).catch(() => {});
    const base = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000/ws/issues";
    setWsUrl(`${base}?token=${token}`);
  }, [session, status, params.id]);

  useEffect(() => {
    if (status === "loading" || !session?.accessToken) return;
    const token = (session as { accessToken?: string }).accessToken;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    fetch(`${apiUrl}/issues/${params.id}/timeline`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => { if (data.events) setTimelineEvents(data.events); })
      .catch(() => {});
  }, [session, status, params.id]);

  const { lastMessage, connected } = useWebSocket(wsUrl ?? "");

  useEffect(() => {
    if (!lastMessage) return;
    if (lastMessage.type === "briefing") setBriefing(lastMessage.data as unknown as Briefing);
    if (lastMessage.type === "spike")    setSpikeData(lastMessage.data as unknown as SpikeData);
    if (lastMessage.type === "comment") {
      const comment = lastMessage.data as unknown as CommentData;
      setCommentData(comment);
      setSentimentData({ sentiment: comment.sentiment, sentiment_score: 1 });
    }
  }, [lastMessage]);

  if (status === "loading") return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-6 animate-pulse">
      <div className="h-7 w-40 rounded bg-stone-800" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-xl border border-stone-800 bg-stone-900 p-5 space-y-3">
          <div className="h-4 w-24 rounded bg-stone-700" />
          <div className="h-3 w-full rounded bg-stone-700" />
          <div className="h-3 w-3/4 rounded bg-stone-700" />
        </div>
      ))}
    </main>
  );

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <SystemBanner />

      <div className="space-y-1">
        <Link href="/issues" className="inline-flex items-center gap-1 text-sm text-stone-300 hover:text-stone-300 transition-colors">
          ← Trend
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {issue && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[issue.status]}`}>
                {issue.status}
              </span>
            )}
            <h1 className="text-xl font-bold">{issue?.title ?? params.id}</h1>
          </div>
          <span className={`text-sm px-2.5 py-1 rounded-full ${connected ? "bg-green-900/50 text-green-400" : "bg-stone-800 text-stone-400"}`}>
            {connected ? "실시간 연결됨" : "연결 중..."}
          </span>
        </div>
        {issue && (
          <p className="text-sm text-stone-300">
            편집 {issue.edit_count}회 · {new Date(issue.updated_at).toLocaleString("ko-KR")}
          </p>
        )}
      </div>

      <section>
        <h2 className="text-sm font-semibold text-stone-400 mb-3">AI 브리핑</h2>
        <BriefingCard briefing={briefing} />
      </section>

      <section>
        <h2 className="text-sm font-semibold text-stone-400 mb-3">편집 스파이크</h2>
        <div className="rounded-xl border border-stone-800 bg-stone-900 p-5">
          <SpikeChart spikeData={spikeData} />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-stone-400 mb-3">감성 분포</h2>
        <div className="rounded-xl border border-stone-800 bg-stone-900 p-5">
          <SentimentChart sentimentData={sentimentData} />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-stone-400 mb-3">이슈 타임라인</h2>
        <div className="rounded-xl border border-stone-800 bg-stone-900 p-5">
          <IssueTimeline events={timelineEvents} />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-stone-400 mb-3">Reddit 댓글 피드</h2>
        <div className="rounded-xl border border-stone-800 bg-stone-900 p-5">
          <CommentFeed commentData={commentData} />
        </div>
      </section>
    </main>
  );
}
