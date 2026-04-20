import IssueList from "@/components/IssueList";

export default function IssuesPage() {
  return (
    <main className="p-8">
      <h1 className="mb-6 text-2xl font-bold">트렌딩 이슈</h1>
      <IssueList />
    </main>
  );
}
