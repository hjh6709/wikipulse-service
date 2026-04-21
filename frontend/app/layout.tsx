import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "WikiPulse",
  description: "Real-time Wikipedia edit spike dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-950 text-gray-100 antialiased">
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
