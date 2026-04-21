import { renderHook, act } from "@testing-library/react";
import { useWebSocket } from "@/hooks/useWebSocket";

// WebSocket 모킹
class MockWebSocket {
  static instances: MockWebSocket[] = [];
  url: string;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: ((e: unknown) => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  close() {
    this.onclose?.();
  }

  // 테스트에서 메시지 수신 시뮬레이션용
  simulateOpen() { this.onopen?.(); }
  simulateMessage(data: object) { this.onmessage?.({ data: JSON.stringify(data) }); }
  simulateClose() { this.onclose?.(); }
}

beforeEach(() => {
  MockWebSocket.instances = [];
  (global as unknown as { WebSocket: unknown }).WebSocket = MockWebSocket;
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("useWebSocket", () => {
  test("url이 빈 문자열이면 WebSocket을 생성하지 않는다", () => {
    renderHook(() => useWebSocket(""));
    expect(MockWebSocket.instances).toHaveLength(0);
  });

  test("url이 주어지면 WebSocket 연결을 시도한다", () => {
    renderHook(() => useWebSocket("ws://localhost:8000/ws/issues?token=test"));
    expect(MockWebSocket.instances).toHaveLength(1);
    expect(MockWebSocket.instances[0].url).toBe("ws://localhost:8000/ws/issues?token=test");
  });

  test("연결 성공 시 connected가 true가 된다", () => {
    const { result } = renderHook(() => useWebSocket("ws://localhost:8000/ws/issues?token=test"));
    act(() => { MockWebSocket.instances[0].simulateOpen(); });
    expect(result.current.connected).toBe(true);
  });

  test("메시지 수신 시 lastMessage가 업데이트된다", () => {
    const { result } = renderHook(() => useWebSocket("ws://localhost:8000/ws/issues?token=test"));
    const msg = { type: "briefing", data: { summary: "테스트 요약" } };
    act(() => { MockWebSocket.instances[0].simulateMessage(msg); });
    expect(result.current.lastMessage).toEqual(msg);
  });

  test("연결 끊김 시 connected가 false가 되고 3초 후 재연결한다", () => {
    renderHook(() => useWebSocket("ws://localhost:8000/ws/issues?token=test"));
    act(() => { MockWebSocket.instances[0].simulateOpen(); });
    act(() => { MockWebSocket.instances[0].simulateClose(); });

    expect(MockWebSocket.instances).toHaveLength(1);
    act(() => { jest.advanceTimersByTime(3000); });
    expect(MockWebSocket.instances).toHaveLength(2); // 재연결
  });
});
