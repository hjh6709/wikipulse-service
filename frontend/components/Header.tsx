"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

const HIDDEN_PATHS = ["/login", "/onboarding"];

export default function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  if (HIDDEN_PATHS.includes(pathname)) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/95 backdrop-blur">
      <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-white tracking-tight">
            WikiPulse
          </Link>
          {status === "authenticated" && (
            <nav className="flex gap-4">
              {[
                { href: "/issues", label: "이슈 피드" },
                { href: "/history", label: "히스토리" },
                { href: "/settings/account", label: "설정" },
              ].map(({ href, label }) => {
                const active = pathname === href || pathname.startsWith(href === "/settings/account" ? "/settings" : href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`text-sm transition-colors ${
                      active ? "text-white font-medium" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {status === "authenticated" ? (
            <>
              <span className="text-xs text-gray-500">
                {(session as { user?: { name?: string } } | null)?.user?.name ?? ""}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                로그아웃
              </button>
            </>
          ) : status === "unauthenticated" ? (
            <Link
              href="/login"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              로그인
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
