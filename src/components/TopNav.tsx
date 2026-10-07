"use client";
// แถบนำทางหลัก + แสดงเหรียญ/คะแนน/หัวใจแบบเรียลไทม์
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { loadState, saveState } from "@/lib/storage";
import { getMuted, setMuted } from "@/lib/sound";

const MENU = [
  { href: "/", label: "หน้าแรก", icon: "🏠" },
  { href: "/select", label: "เลือกชั้น", icon: "🎓" },
  { href: "/formulas", label: "คลังสูตร", icon: "📚" },
  { href: "/notebook", label: "สมุดข้อผิด", icon: "📓" },
  { href: "/stats", label: "สถิติ", icon: "🏆" },
];

export default function TopNav() {
  const path = usePathname();
  const [coins, setCoins] = useState(0);
  const [score, setScore] = useState(0);
  const [mute, setMute] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const s = loadState();
    setCoins(s.coins);
    setScore(s.score);
    setMute(getMuted());
    // ฟังเหตุการณ์อัปเดตสถานะจากหน้าอื่น ๆ
    const h = () => {
      const n = loadState();
      setCoins(n.coins);
      setScore(n.score);
    };
    window.addEventListener("mq:update", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("mq:update", h);
      window.removeEventListener("storage", h);
    };
  }, [path]);

  const toggleSound = () => {
    const v = !mute;
    setMute(v);
    setMuted(v);
    const s = loadState();
    saveState({ ...s, soundOn: !v });
  };

  return (
    <header className="sticky top-0 z-50 border-b-4 border-[#0b0620] bg-[#1a1030]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="text-2xl">🍄</span>
          <span className="font-pixel text-[10px] leading-tight text-[#fbd000] sm:text-xs">
            MATH
            <br />
            QUEST
          </span>
        </Link>

        <nav className="hidden flex-1 items-center gap-1 lg:flex">
          {MENU.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className={`pixel-btn rounded-none px-3 py-2 text-xs ${
                path === m.href ? "bg-[#fbd000] text-[#0b0620]" : "bg-[#2a1a4a] text-white hover:bg-[#3a2a5a]"
              }`}
            >
              {m.icon} {m.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <span className="pixel-box flex items-center gap-1 bg-[#2a1a4a] px-2 py-1.5 text-xs font-bold text-[#fbd000]">
            <span className="coin-spin inline-block">🪙</span>
            <span className="font-pixel text-[10px]">{coins}</span>
          </span>
          <span className="pixel-box hidden items-center gap-1 bg-[#2a1a4a] px-2 py-1.5 text-xs font-bold text-[#7CFC00] sm:flex">
            ⭐<span className="font-pixel text-[10px]">{score}</span>
          </span>
          <button onClick={toggleSound} className="pixel-btn bg-[#2a1a4a] px-2 py-1.5 text-xs" title="เปิด/ปิดเสียง 8-bit">
            {mute ? "🔇" : "🔊"}
          </button>
          <button onClick={() => setOpen(!open)} className="pixel-btn bg-[#c84c0c] px-2 py-1.5 text-xs lg:hidden">
            ☰
          </button>
        </div>
      </div>

      {open && (
        <nav className="grid grid-cols-2 gap-1 border-t-4 border-[#0b0620] bg-[#120a26] p-2 lg:hidden">
          {MENU.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              onClick={() => setOpen(false)}
              className={`pixel-btn px-3 py-2 text-xs ${path === m.href ? "bg-[#fbd000] text-[#0b0620]" : "bg-[#2a1a4a]"}`}
            >
              {m.icon} {m.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
