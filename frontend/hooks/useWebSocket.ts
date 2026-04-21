"use client";

import { useEffect, useRef, useState } from "react";

type WSMessage = {
  type: "sentiment" | "briefing" | "spike" | "comment";
  data: Record<string, unknown>;
};

export function useWebSocket(url: string) {
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!url) return;

    function connect() {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        setTimeout(connect, 3000);
      };
      ws.onerror = () => ws.close();
      ws.onmessage = (event) => {
        const msg: WSMessage = JSON.parse(event.data);
        setLastMessage(msg);
      };
    }

    connect();
    return () => wsRef.current?.close();
  }, [url]);

  return { lastMessage, connected };
}
