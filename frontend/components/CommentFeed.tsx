"use client";

import { useEffect, useState } from "react";

type Comment = {
  comment_id: string;
  author: string;
  body: string;
  score: number;
  sentiment: "positive" | "negative" | "neutral";
  created_at: string;
};

const SENTIMENT_STYLE = {
  positive: "bg-green-500/10 text-green-400",
  negative: "bg-red-500/10 text-red-400",
  neutral:  "bg-stone-500/10 text-slate-400",
};

const SENTIMENT_LABEL = {
  positive: "긍정",
  negative: "부정",
  neutral:  "중립",
};

type SortMode = "popular" | "latest";

function CommentBody({ body }: { body: string }) {
  const [expanded, setExpanded] = useState(false);
  const lines = body.split("\n");
  const isLong = lines.length > 3 || body.length > 200;
  const displayText = !isLong || expanded
    ? body
    : lines.slice(0, 3).join("\n").slice(0, 200);

  return (
    <div>
      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{displayText}</p>
      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-sm text-blue-400 hover:text-blue-400 mt-1"
        >
          {expanded ? "접기 ▲" : "더보기 ▼"}
        </button>
      )}
    </div>
  );
}

type Props = {
  commentData: Omit<Comment, "comment_id"> & { comment_id?: string } | null;
};

export function CommentFeed({ commentData }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("popular");

  useEffect(() => {
    if (!commentData) return;
    const comment: Comment = {
      comment_id: commentData.comment_id ?? `c-${Date.now()}`,
      author: commentData.author,
      body: commentData.body,
      score: commentData.score,
      sentiment: commentData.sentiment,
      created_at: commentData.created_at,
    };
    setComments((prev) => {
      const updated = [comment, ...prev.filter((c) => c.comment_id !== comment.comment_id)];
      return updated.slice(0, 20);
    });
  }, [commentData]);

  const sorted = [...comments].sort((a, b) =>
    sortMode === "popular"
      ? b.score - a.score
      : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-28 gap-2 text-slate-400">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
        <span className="text-sm">댓글 수신 대기 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-300">댓글 {comments.length}개</span>
        <div className="flex gap-1">
          {(["popular", "latest"] as SortMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setSortMode(mode)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                sortMode === mode
                  ? "border-blue-500 text-blue-400 bg-blue-500/10"
                  : "border-slate-700 text-slate-500 hover:text-slate-400"
              }`}
            >
              {mode === "popular" ? "인기순" : "최신순"}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-slate-900 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-blue-500/40 [&::-webkit-scrollbar-thumb:hover]:bg-blue-500/70">
        {sorted.map((c) => (
          <div key={c.comment_id} className="rounded-lg border border-slate-800 bg-navy p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-stone-200">{c.author}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${SENTIMENT_STYLE[c.sentiment]}`}>
                  {SENTIMENT_LABEL[c.sentiment]}
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm text-slate-300">
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M6 1L7.5 4.5H11L8.25 6.75L9.25 10.5L6 8.25L2.75 10.5L3.75 6.75L1 4.5H4.5L6 1Z" />
                </svg>
                <span>{c.score.toLocaleString()}</span>
              </div>
            </div>
            <CommentBody body={c.body} />
            <p className="text-sm text-slate-300">
              {new Date(c.created_at).toLocaleString("ko-KR")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
