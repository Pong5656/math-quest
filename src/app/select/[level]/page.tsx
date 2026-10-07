"use client";

// ===== หน้าเลือกเล่มและบท (ทุกบทเปิดอิสระ ไม่ล็อก) =====

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Chapter, LevelId } from "@/lib/types";
import { chaptersOf, LEVELS } from "@/data";
import { getSave } from "@/lib/store";

/** การ์ดบทเรียน พร้อมสถานะโหมดต่าง ๆ */
function ChapterCard({ ch, done, delay }: { ch: Chapter; done: { game: boolean; mini: boolean; boss: boolean }; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="pixel-card flex h-full flex-col bg-white p-4"
    >
      <div className="flex items-start gap-3">
        <span className="text-4xl">{ch.emoji}</span>
        <div>
          <p className="text-xs font-bold text-slate-500">บทที่ {ch.num}</p>
          <h3 className="text-lg font-extrabold leading-6">{ch.title}</h3>
        </div>
      </div>
      <ul className="mt-3 flex-1 space-y-1 text-xs font-medium text-slate-600">
        {ch.objectives.slice(0, 3).map((o) => (
          <li key={o} className="flex gap-1.5">
            <span className="text-green-600">▸</span>
            <span>{o}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
        <span className={`rounded-sm border-2 px-1.5 py-0.5 ${done.game ? "border-green-700 bg-green-200 text-green-900" : "border-slate-300 bg-slate-100 text-slate-400"}`}>🏁 ด่าน</span>
        <span className={`rounded-sm border-2 px-1.5 py-0.5 ${done.mini ? "border-green-700 bg-green-200 text-green-900" : "border-slate-300 bg-slate-100 text-slate-400"}`}>🕹️ มินิเกม</span>
        <span className={`rounded-sm border-2 px-1.5 py-0.5 ${done.boss ? "border-green-700 bg-green-200 text-green-900" : "border-slate-300 bg-slate-100 text-slate-400"}`}>⚔️ บอส</span>
        <span className="ml-auto text-slate-500">โจทย์ {ch.questions.length} ข้อ</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link href={`/chapter/${ch.id}/study`} className="pixel-btn rounded-sm bg-sky-300 px-2 py-2 text-center font-pixel text-[9px] leading-4 text-[#23273a]">
          📖 เรียน
        </Link>
        <Link href={`/chapter/${ch.id}/mode`} className="pixel-btn rounded-sm bg-yellow-400 px-2 py-2 text-center font-pixel text-[9px] leading-4 text-[#23273a]">
          🎮 เล่น
        </Link>
      </div>
    </motion.div>
  );
}

export default function SelectLevelPage({ params }: { params: Promise<{ level: string }> }) {
  const { level } = use(params);
  const [save, setSave] = useState(getSave());
  useEffect(() => setSave(getSave()), []);

  const lv = LEVELS.find((l) => l.id === level);
  if (!lv) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="font-pixel text-sm">ไม่พบชั้นเรียนนี้ 😢</p>
        <Link href="/select" className="pixel-btn mt-6 inline-block rounded-sm bg-yellow-400 px-6 py-3 font-pixel text-xs text-[#23273a]">← กลับไปเลือกชั้น</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/select" className="pixel-btn rounded-sm bg-white px-3 py-2 text-sm font-bold text-[#23273a]">← เลือกชั้น</Link>
        <h1 className="font-pixel text-sm text-[#23273a] sm:text-base">
          {lv.emoji} {lv.label}
        </h1>
        <p className="ml-auto rounded-sm border-2 border-green-800 bg-green-200 px-3 py-1 text-xs font-bold text-green-900">
          🔓 เปิดทุกบท เลือกเรียนบทไหนก่อนก็ได้!
        </p>
      </div>

      {([1, 2] as const).map((book) => {
        const chs = chaptersOf(level as LevelId, book);
        if (chs.length === 0) return null;
        return (
          <section key={book} className="mt-8">
            <h2 className="mb-4 inline-block rounded-sm border-4 border-[#23273a] bg-[#fff8e7] px-4 py-2 font-pixel text-[11px] text-amber-700">
              📘 เล่ม {book}
            </h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {chs.map((ch, i) => (
                <ChapterCard
                  key={ch.id}
                  ch={ch}
                  delay={i * 0.08}
                  done={{
                    game: save.done[ch.id]?.game ?? false,
                    mini: save.done[ch.id]?.mini ?? false,
                    boss: save.done[ch.id]?.boss ?? false,
                  }}
                />
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
