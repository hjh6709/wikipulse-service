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
  발생: "bg-sky-500/15 text-sky-400",
  확산: "bg-blue-500/15 text-blue-500",
  정점: "bg-orange-500/15 text-orange-400",
  소강: "bg-slate-500/15 text-slate-400",
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
      {children}
    </h2>
  );
}

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
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-pulse">
      <div className="h-7 w-40 rounded bg-slate-800" />
      <div className="rounded-xl bg-surface ring-1 ring-blue-500/10 shadow-blue-glow p-6 space-y-3">
        <div className="h-4 w-24 rounded bg-slate-700" />
        <div className="h-3 w-full rounded bg-slate-700" />
        <div className="h-3 w-3/4 rounded bg-slate-700" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl bg-surface ring-1 ring-blue-500/10 p-5 space-y-3">
            <div className="h-4 w-24 rounded bg-slate-700" />
            <div className="h-3 w-full rounded bg-slate-700" />
            <div className="h-3 w-3/4 rounded bg-slate-700" />
          </div>
        ))}
      </div>
    </main>
  );

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <SystemBanner />

      {/* 헤더 */}
      <div className="space-y-3">
        <Link
          href="/issues"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300 transition-colors duration-300"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Trend
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            {issue && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[issue.status]}`}>
                {issue.status}
              </span>
            )}
            <h1 className="text-2xl font-bold leading-tight">{issue?.title ?? params.id}</h1>
            {issue && (
              <p className="text-sm text-slate-500">
                편집 <span className="text-slate-300 font-medium">{issue.edit_count.toLocaleString()}회</span>
                {" · "}
                {new Date(issue.updated_at).toLocaleString("ko-KR")}
              </p>
            )}
          </div>
          <span className={`shrink-0 text-xs px-2.5 py-1.5 rounded-full font-medium transition-colors ${
            connected
              ? "bg-green-500/10 text-green-400 ring-1 ring-green-500/30"
              : "bg-slate-800 text-slate-500"
          }`}>
            {connected ? "● 실시간" : "연결 중..."}
          </span>
        </div>
      </div>

      {/* AI 브리핑 — 전체 너비 */}
      <section>
        <h2 className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
          <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
          </svg>
          AI 브리핑
        </h2>
        <BriefingCard briefing={briefing} />
      </section>

      {/* 2단 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 items-start">
        {/* 좌측: 스파이크 + 타임라인 */}
        <div className="space-y-6">
          <section>
            <SectionTitle>편집 스파이크</SectionTitle>
            <div className="rounded-xl bg-surface ring-1 ring-blue-500/10 shadow-blue-glow p-5">
              <SpikeChart spikeData={spikeData} />
            </div>
          </section>

          <section>
            <SectionTitle>이슈 타임라인</SectionTitle>
            <div className="rounded-xl bg-surface ring-1 ring-blue-500/10 shadow-blue-glow p-5">
              <IssueTimeline events={timelineEvents} />
            </div>
          </section>
        </div>

        {/* 우측: 감성 분포 + Reddit */}
        <div className="space-y-6">
          <section>
            <SectionTitle>감성 분포</SectionTitle>
            <div className="rounded-xl bg-surface ring-1 ring-blue-500/10 shadow-blue-glow p-5">
              <SentimentChart sentimentData={sentimentData} />
            </div>
          </section>

          <section>
            <SectionTitle>Reddit 댓글 피드</SectionTitle>
            <div className="rounded-xl bg-surface ring-1 ring-blue-500/10 shadow-blue-glow p-5">
              <CommentFeed commentData={commentData} />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
