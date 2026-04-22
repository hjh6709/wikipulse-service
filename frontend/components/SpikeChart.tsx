"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type SpikePoint = {
  time: string;
  edit_count: number;
};

type Props = {
  spikeData: { edit_count: number; triggered_at?: string } | null;
};

export function SpikeChart({ spikeData }: Props) {
  const [points, setPoints] = useState<SpikePoint[]>([]);

  useEffect(() => {
    if (!spikeData) return;
    const time = new Date(spikeData.triggered_at ?? Date.now()).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setPoints((prev) => [...prev.slice(-19), { time, edit_count: spikeData.edit_count }]);
  }, [spikeData]);

  if (points.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-slate-400">
        데이터 수신 대기 중...
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={points} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="spikeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2736" />
        <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#64748b" }} />
        <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
        <Tooltip
          contentStyle={{ background: "#161B22", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 8 }}
          labelStyle={{ color: "#94a3b8" }}
          itemStyle={{ color: "#93c5fd" }}
        />
        <Area
          type="monotone"
          dataKey="edit_count"
          stroke="#3B82F6"
          strokeWidth={2}
          fill="url(#spikeGradient)"
          name="편집 횟수"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
