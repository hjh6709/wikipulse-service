"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { fetchBookmarks, deleteBookmark, type Bookmark } from "@/lib/api";

export default function BookmarksPage() {
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken ?? "";

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetchBookmarks(token)
      .then(setBookmarks)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  async function handleDelete(bookmarkId: string) {
    if (!token) return;
    await deleteBookmark(bookmarkId, token).catch(() => {});
    setBookmarks((prev) => prev.filter((b) => b.bookmark_id !== bookmarkId));
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">북마크</h2>

      <div className="rounded-xl border border-slate-800 bg-surface p-6 space-y-3">
        {loading && <p className="text-sm text-slate-400">로딩 중...</p>}
        {!loading && bookmarks.length === 0 && (
          <p className="text-sm text-slate-400">북마크한 이슈가 없습니다.</p>
        )}
        {bookmarks.map((b) => (
          <div key={b.bookmark_id} className="flex items-center justify-between">
            <Link
              href={`/issues/${b.issue_id}`}
              className="text-sm text-blue-400 hover:text-blue-400"
            >
              {b.issue_id}
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-300">
                {new Date(b.created_at).toLocaleDateString("ko-KR")}
              </span>
              <button
                onClick={() => handleDelete(b.bookmark_id)}
                className="text-xs text-red-500 hover:text-red-400"
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
