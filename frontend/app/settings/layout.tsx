import type { Metadata } from "next";
import SettingsNav from "@/components/SettingsNav";

export const metadata: Metadata = { title: "설정 — WikiPulse" };

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="mb-6 text-2xl font-bold">설정</h1>
      <div className="flex gap-8">
        <SettingsNav />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
