"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/settings/account", label: "계정" },
  { href: "/settings/preferences", label: "개인화" },
  { href: "/settings/bookmarks", label: "북마크" },
  { href: "/settings/alerts", label: "알림" },
];

export default function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="w-32 shrink-0">
      <ul className="space-y-0.5">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block border-l-2 px-3 py-2 text-sm transition-colors ${
                  active
                    ? "border-blue-500 text-white font-medium"
                    : "border-transparent text-slate-400 hover:text-white hover:border-slate-600"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
