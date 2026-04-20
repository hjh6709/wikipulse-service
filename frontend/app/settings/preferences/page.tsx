const CATEGORIES = ["정치", "경제", "스포츠", "연예", "사회·범죄", "과학·기술"];

export default function PreferencesPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">개인화</h2>

      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 space-y-4">
        <p className="text-sm text-gray-400 mb-3">관심 카테고리</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <span
              key={cat}
              className="rounded-full border border-gray-700 px-3 py-1 text-sm text-gray-400"
            >
              {cat}
            </span>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-2">카테고리 선택 기능 — 준비 중</p>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <p className="text-sm text-gray-400">구독 토픽 관리 — 준비 중</p>
      </div>
    </div>
  );
}
