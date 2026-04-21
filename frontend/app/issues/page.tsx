import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import IssueList from "@/components/IssueList";

export const metadata: Metadata = { title: "트렌딩 이슈 — WikiPulse" };

export default async function IssuesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <main className="mx-auto max-w-2xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">트렌딩 이슈</h1>
        <span className="text-sm text-gray-400">{(session.user?.name ?? "")}</span>
      </div>
      <IssueList />
    </main>
  );
}
