"use client";
// หน้าเลือกเล่มและบท (ทุกบทเปิดเรียนได้ ไม่ล็อก ไม่บังคับลำดับ)
import Link from "next/link";
import { useParams } from "next/navigation";
import { chaptersOf, getLevel } from "@/data";
import { useGameState } from "@/lib/useGameState";
import { emptyState } from "@/lib/storage";
import ChapterCard from "@/components/ChapterCard";

export default function SelectChapter() {
  const params = useParams<{ level: string }>();
  const level = getLevel(params.level ?? "");
  const { state, ready } = useGameState();

  if (!level) {
    return (
      <div className="pixel-box bg-[#1b1140] p-6 text-center">
        <p className="font-pixel text-sm text-red-400">404 — ไม่พบชั้นเรียนนี้</p>
        <Link href="/select" className="pixel-btn mt-4 inline-block bg-[#fbd000] px-4 py-2 text-sm text-[#0b0620]">
          ◀ กลับไปเลือกชั้น
        </Link>
      </div>
    );
  }

  const books: Array<1 | 2> = [1, 2];

  return (
    <div>
      <header className="pixel-box mb-4 p-4" style={{ background: `linear-gradient(135deg, ${level.color}33, #1b1140)` }}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-4xl">{level.emoji}</span>
          <div>
            <p className="font-pixel text-[10px] text-white/60">WORLD {level.id.toUpperCase()}</p>
            <h1 className="text-xl font-extrabold" style={{ color: level.color }}>
              {level.name}
            </h1>
          </div>
          <Link href="/select" className="pixel-btn ml-auto bg-[#0b0620] px-3 py-2 text-xs text-white">
            ◀ เปลี่ยนชั้น
          </Link>
        </div>
        <p className="mt-2 text-xs text-white/70">
          🔓 ทุกบทเปิดให้เข้าเรียนทันที เลือกเรียนบทไหนก่อนก็ได้ ไม่บังคับลำดับ (ตามแนว Project 14 ของ สสวท.)
        </p>
      </header>

      {books.map((b) => {
        const chs = chaptersOf(level.id, b);
        if (chs.length === 0) return null;
        return (
          <section key={b} className="mb-6">
            <h2 className="mb-3 flex items-center gap-2 font-pixel text-[11px] text-[#fbd000]">
              📘 เล่ม {b} <span className="text-white/40">({chs.length} บท)</span>
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {chs.map((c, i) => (
                <ChapterCard key={c.id} chapter={c} state={ready ? state : emptyState} index={i} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
