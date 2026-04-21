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

const SENTIMENT_COLOR = {
  positive: "text-green-400",
  negative: "text-red-400",
  neutral: "text-gray-400",
};

type SortMode = "latest" | "popular";

function CommentBody({ body }: { body: string }) {
  const [expanded, setExpanded] = useState(false);
  const lines = body.split("\n");
  const isLong = lines.length > 3 || body.length > 200;
  const displayText = !isLong || expanded
    ? body
    : lines.slice(0, 3).join("\n").slice(0, 200);

  return (
    <div>
      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{displayText}</p>
      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-indigo-400 hover:text-indigo-300 mt-1"
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
  const [sortMode, setSortMode] = useState<SortMode>("latest");

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
      <div className="flex items-center justify-center h-24 text-sm text-gray-500">
        댓글 수신 대기 중...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(["latest", "popular"] as SortMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setSortMode(mode)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              sortMode === mode
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/10"
                : "border-gray-700 text-gray-500 hover:text-gray-400"
            }`}
          >
            {mode === "latest" ? "최신순" : "인기순"}
          </button>
        ))}
        <span className="text-xs text-gray-600 ml-auto self-center">{comments.length}개</span>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {sorted.map((c) => (
          <div key={c.comment_id} className="rounded-lg border border-gray-800 bg-gray-950 p-3 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-indigo-400">{c.author}</span>
              <div className="flex items-center gap-2">
                <span className={SENTIMENT_COLOR[c.sentiment]}>{c.sentiment}</span>
                <span className="text-gray-600">↑ {c.score}</span>
              </div>
            </div>
            <CommentBody body={c.body} />
            <p className="text-xs text-gray-600">
              {new Date(c.created_at).toLocaleString("ko-KR")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
