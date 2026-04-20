export default function IssuePage({ params }: { params: { id: string } }) {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Issue: {params.id}</h1>
      <p className="mt-2 text-gray-400">실시간 데이터 — Week 3에서 구현 예정</p>
    </main>
  );
}
