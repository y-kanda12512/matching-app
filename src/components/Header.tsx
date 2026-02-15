"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "ホーム", icon: "🏠" },
  { href: "/likes", label: "いいね", icon: "💗" },
  { href: "/matches", label: "マッチ", icon: "✨" },
  { href: "/messages", label: "メッセージ", icon: "💬" },
  { href: "/profile/edit", label: "プロフィール", icon: "👤" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold text-pink-500">
          MatchApp
        </Link>
      </div>
      <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-around">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center py-2 text-xs transition-colors ${
                  isActive
                    ? "text-pink-500"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
