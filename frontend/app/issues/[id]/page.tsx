"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { BriefingCard } from "@/components/BriefingCard";
import { CommentFeed } from "@/components/CommentFeed";
import { IssueTimeline } from "@/components/IssueTimeline";
import { SentimentChart } from "@/components/SentimentChart";
import { SpikeChart } from "@/components/SpikeChart";
import { SystemBanner } from "@/components/SystemBanner";
import { useWebSocket } from "@/hooks/useWebSocket";

type Briefing = { summary: string; key_points: string[]; created_at: string };
type SpikeData = { edit_count: number; triggered_at?: string };
type SentimentData = { sentiment: string; sentiment_score: number };
type CommentData = { comment_id?: string; author: string; body: string; score: number; sentiment: "positive" | "negative" | "neutral"; created_at: string };
type TimelineEvent = { event_id: string; type: "spike" | "reddit" | "sentiment" | "briefing"; label: string; description: string; timestamp: string };

export default function IssuePage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const [wsUrl, setWsUrl] = useState<string | null>(null);

  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [spikeData, setSpikeData] = useState<SpikeData | null>(null);
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);
  const [commentData, setCommentData] = useState<CommentData | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    if (status === "loading" || !session?.accessToken) return;
    const base = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000/ws/issues";
    setWsUrl(`${base}?token=${session.accessToken}`);
  }, [session, status]);

  useEffect(() => {
    if (status === "loading" || !session?.accessToken) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    fetch(`${apiUrl}/issues/${params.id}/timeline`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
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
      <div className="h-7 w-40 rounded bg-gray-800" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-3">
          <div className="h-4 w-24 rounded bg-gray-700" />
          <div className="h-3 w-full rounded bg-gray-700" />
          <div className="h-3 w-3/4 rounded bg-gray-700" />
        </div>
      ))}
    </main>
  );

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <SystemBanner />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">이슈 #{params.id}</h1>
        <span className={`text-xs px-2 py-1 rounded-full ${connected ? "bg-green-900 text-green-400" : "bg-gray-800 text-gray-500"}`}>
          {connected ? "실시간 연결됨" : "연결 중..."}
        </span>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-gray-400 mb-3">AI 브리핑</h2>
        <BriefingCard briefing={briefing} />
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-400 mb-3">편집 스파이크</h2>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <SpikeChart spikeData={spikeData} />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-400 mb-3">감성 분포</h2>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <SentimentChart sentimentData={sentimentData} />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-400 mb-3">이슈 타임라인</h2>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <IssueTimeline events={timelineEvents} />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-400 mb-3">Reddit 댓글 피드</h2>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <CommentFeed commentData={commentData} />
        </div>
      </section>
    </main>
  );
}
