import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import IssueList from "@/components/IssueList";

// next-auth useSession 모킹 — 객체를 한 번만 생성해서 매 렌더 참조 동일하게 유지
jest.mock("next-auth/react", () => {
  const session = { data: { accessToken: "mock-token", user: { name: "test" } }, status: "authenticated" };
  return { useSession: () => session };
});

// fetchIssues 모킹
jest.mock("@/lib/api", () => ({
  fetchIssues: jest.fn(),
}));

const mockIssues = [
  { issue_id: "issue-1", title: "Mock Issue 1", edit_count: 10, spike_score: 0.6, status: "발생" as const, updated_at: "2026-04-21T00:00:00Z" },
  { issue_id: "issue-2", title: "Mock Issue 2", edit_count: 20, spike_score: 0.7, status: "확산" as const, updated_at: "2026-04-21T00:00:00Z" },
  { issue_id: "issue-3", title: "Mock Issue 3", edit_count: 30, spike_score: 0.8, status: "정점" as const, updated_at: "2026-04-21T00:00:00Z" },
];

describe("IssueList", () => {
  beforeEach(() => {
    const { fetchIssues } = require("@/lib/api");
    fetchIssues.mockResolvedValue(mockIssues);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("로딩 중 스켈레톤이 표시된다", () => {
    const { fetchIssues } = require("@/lib/api");
    fetchIssues.mockReturnValue(new Promise(() => {})); // 영구 대기
    render(<IssueList />);
    // 스켈레톤은 animate-pulse 클래스로 렌더링됨
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  test("이슈 목록이 정상 렌더링된다", async () => {
    render(<IssueList />);
    await waitFor(() => {
      expect(screen.getByText("Mock Issue 1")).toBeInTheDocument();
      expect(screen.getByText("Mock Issue 2")).toBeInTheDocument();
      expect(screen.getByText("Mock Issue 3")).toBeInTheDocument();
    });
  });

  test("status 뱃지가 표시된다", async () => {
    render(<IssueList />);
    await waitFor(() => {
      expect(screen.getByText("발생")).toBeInTheDocument();
      expect(screen.getByText("확산")).toBeInTheDocument();
      expect(screen.getByText("정점")).toBeInTheDocument();
    });
  });

  test("검색어 입력 시 fetchIssues가 해당 쿼리로 호출된다", async () => {
    const { fetchIssues } = require("@/lib/api");
    const user = userEvent.setup();
    render(<IssueList />);

    await waitFor(() => screen.getByPlaceholderText("이슈 검색..."));
    await user.type(screen.getByPlaceholderText("이슈 검색..."), "Mock");

    await waitFor(
      () => {
        expect(fetchIssues).toHaveBeenCalledWith(
          expect.anything(),
          "Mock"
        );
      },
      { timeout: 1000 }
    );
  });

  test("결과 없을 때 빈 상태 메시지가 표시된다", async () => {
    const { fetchIssues } = require("@/lib/api");
    fetchIssues.mockResolvedValue([]);
    render(<IssueList />);
    await waitFor(() => {
      expect(screen.getByText("이슈가 없습니다.")).toBeInTheDocument();
    });
  });

  test("fetch 실패 시 에러 메시지가 표시된다", async () => {
    const { fetchIssues } = require("@/lib/api");
    fetchIssues.mockRejectedValue(new Error("network error"));
    render(<IssueList />);
    await waitFor(() => {
      expect(screen.getByText("이슈를 불러오지 못했습니다.")).toBeInTheDocument();
    });
  });
});
