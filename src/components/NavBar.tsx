"use client";

// ===== แถบเมนูพิกเซลด้านบน =====

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "🏠 หน้าแรก" },
  { href: "/select", label: "🎮 เริ่มเรียน" },
  { href: "/formulas", label: "📜 คลังสูตร" },
  { href: "/notebook", label: "📓 สมุดข้อผิด" },
  { href: "/stats", label: "🏆 สถิติ" },
];

export default function NavBar() {
  const path = usePathname();
  return (
    <nav className="sticky top-0 z-40 border-b-4 border-[#23273a] bg-[#23273a] shadow-[0_4px_0_rgba(0,0,0,0.25)]">
      <div className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto px-3 py-2 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="text-2xl">🍄</span>
          <span className="font-pixel text-[10px] leading-4 text-yellow-300 sm:text-xs">
            MATH<span className="text-white">QUEST</span>
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          {LINKS.map((l) => {
            const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`shrink-0 rounded-sm border-2 px-2 py-1 text-xs font-semibold transition sm:px-3 sm:text-sm ${
                  active
                    ? "border-yellow-300 bg-yellow-300 text-[#23273a]"
                    : "border-transparent text-slate-200 hover:border-yellow-300/50 hover:text-yellow-200"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
