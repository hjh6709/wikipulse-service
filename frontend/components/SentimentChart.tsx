"use client";

import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type SentimentCount = { name: string; value: number; color: string };

const INITIAL: SentimentCount[] = [
  { name: "긍정", value: 0, color: "#22c55e" },
  { name: "부정", value: 0, color: "#ef4444" },
  { name: "중립", value: 0, color: "#6b7280" },
];

const KEY_MAP: Record<string, number> = { positive: 0, negative: 1, neutral: 2 };

type Props = {
  sentimentData: { sentiment: string; sentiment_score: number } | null;
};

export function SentimentChart({ sentimentData }: Props) {
  const [counts, setCounts] = useState<SentimentCount[]>(INITIAL);

  useEffect(() => {
    if (!sentimentData) return;
    const idx = KEY_MAP[sentimentData.sentiment];
    if (idx === undefined) return;
    setCounts((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, value: item.value + 1 } : item))
    );
  }, [sentimentData]);

  const total = counts.reduce((sum, c) => sum + c.value, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-gray-500">
        데이터 수신 대기 중...
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6">
      <ResponsiveContainer width={160} height={160}>
        <PieChart>
          <Pie data={counts} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
            {counts.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8 }}
            itemStyle={{ color: "#d1d5db" }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="space-y-2">
        {counts.map((c) => (
          <div key={c.name} className="flex items-center gap-2 text-sm">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
            <span className="text-gray-400 w-8">{c.name}</span>
            <span className="text-white font-medium">{c.value}</span>
            <span className="text-gray-600 text-xs">
              ({total > 0 ? Math.round((c.value / total) * 100) : 0}%)
            </span>
          </div>
        ))}
        <p className="text-xs text-gray-600 pt-1">총 {total}개 댓글 분석</p>
      </div>
    </div>
  );
}
