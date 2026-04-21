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
    <nav className="w-36 shrink-0">
      <ul className="space-y-1">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-gray-800 text-white font-medium"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
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
