import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">계정 정보</h2>

      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 space-y-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">이름</p>
          <p className="text-sm">{session?.user?.name ?? "-"}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">이메일</p>
          <p className="text-sm">{session?.user?.email ?? "-"}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <p className="text-sm text-gray-400">비밀번호 변경 — 준비 중</p>
      </div>
    </div>
  );
}
