export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">알림 설정</h2>

      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 space-y-4">
        <div>
          <p className="text-sm text-gray-400 mb-1">알림 채널</p>
          <div className="flex gap-3">
            <span className="rounded-full border border-gray-700 px-3 py-1 text-sm text-gray-400">Discord</span>
            <span className="rounded-full border border-gray-700 px-3 py-1 text-sm text-gray-400">이메일</span>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-400 mb-1">알림 임계값 (edit_count)</p>
          <p className="text-xs text-gray-600">알림 조건 설정 기능 — 준비 중</p>
        </div>
      </div>
    </div>
  );
}
