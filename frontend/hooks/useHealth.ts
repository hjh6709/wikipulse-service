"use client";

import { useEffect, useState } from "react";

type HealthStatus = {
  kafka: "ok" | "unavailable";
  redis: "ok" | "unavailable";
};

export function useHealth(intervalMs = 30000) {
  const [health, setHealth] = useState<HealthStatus | null>(null);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

    async function check() {
      try {
        const res = await fetch(`${apiUrl}/health`);
        const data = await res.json();
        setHealth({ kafka: data.kafka, redis: data.redis });
      } catch {
        setHealth({ kafka: "unavailable", redis: "unavailable" });
      }
    }

    check();
    const timer = setInterval(check, intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return health;
}
