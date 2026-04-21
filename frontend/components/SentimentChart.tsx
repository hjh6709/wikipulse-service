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
      <div className="flex flex-col items-center justify-center h-40 gap-2 text-stone-400">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25z" />
        </svg>
        <span className="text-sm">데이터 수신 대기 중...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-8">
      <div className="relative shrink-0">
        <ResponsiveContainer width={140} height={140}>
          <PieChart>
            <Pie
              data={counts}
              cx="50%"
              cy="50%"
              innerRadius={42}
              outerRadius={65}
              dataKey="value"
              strokeWidth={0}
              paddingAngle={2}
            >
              {counts.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const { name, value, color } = payload[0].payload as SentimentCount;
                const pct = Math.round(((value as number) / total) * 100);
                return (
                  <div className="rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 shadow-xl text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                      <span className="text-stone-200 font-medium">{name}</span>
                    </div>
                    <p className="mt-1 text-stone-400">{value as number}개 · {pct}%</p>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-bold text-white">{total}</span>
          <span className="text-sm text-stone-400">댓글</span>
        </div>
      </div>

      <div className="flex-1 space-y-3">
        {counts.map((c) => {
          const pct = total > 0 ? Math.round((c.value / total) * 100) : 0;
          return (
            <div key={c.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400 font-medium">{c.name}</span>
                <span className="text-stone-300">{c.value}개 <span className="text-stone-400">({pct}%)</span></span>
              </div>
              <div className="h-1.5 rounded-full bg-stone-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: c.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
