import Link from "next/link";

const NAV = [
  { href: "/settings/account", label: "계정" },
  { href: "/settings/preferences", label: "개인화" },
  { href: "/settings/bookmarks", label: "북마크" },
  { href: "/settings/alerts", label: "알림" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="mb-6 text-2xl font-bold">설정</h1>
      <div className="flex gap-8">
        <nav className="w-36 shrink-0">
          <ul className="space-y-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
