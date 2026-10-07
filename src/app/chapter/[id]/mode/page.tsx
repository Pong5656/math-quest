"use client";

// ===== หน้าเลือกโหมด: เรียน / ด่านเกม / มินิเกม / ตะลุยโจทย์ / บอส =====

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getChapter } from "@/data";
import { getSave } from "@/lib/store";

const MODES = [
  { key: "study", href: (id: string) => `/chapter/${id}/study`, icon: "📖", title: "โหมดเรียน", desc: "ทบทวนหน้าเรียนจับมือ 6 สเต็ปได้ทุกเมื่อ", color: "bg-sky-300", badge: null },
  { key: "game", href: (id: string) => `/chapter/${id}/play?mode=game`, icon: "🍄", title: "ด่านมาริโอ", desc: "เดิน-กระโดดชนบล็อก ? ตอบโจทย์ เก็บเหรียญ ไปชนธงชัย", color: "bg-green-300", badge: "game" },
  { key: "mini", href: (id: string) => `/chapter/${id}/play?mode=mini`, icon: "🕹️", title: "มินิเกมประจำบท", desc: "เกมเฉพาะบทนี้บทเดียว ออกแบบตามแนวคิดของเนื้อหา", color: "bg-fuchsia-300", badge: "mini" },
  { key: "quiz", href: (id: string) => `/chapter/${id}/play?mode=quiz`, icon: "🎯", title: "ตะลุยโจทย์", desc: "ทำโจทย์รวดเดียว เลือกกระดับ 🟢🟡🔴 วัดความเข้าใจ", color: "bg-yellow-300", badge: null },
  { key: "boss", href: (id: string) => `/chapter/${id}/play?mode=boss`, icon: "🐲", title: "บอสใหญ่", desc: "โจทย์ยาก จับเวลา 45 วิ/ข้อ เหรียญพิเศษ — เหมือนข้อสอบจริง!", color: "bg-red-300", badge: "boss" },
] as const;

export default function ModePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const ch = getChapter(id);
  const [save, setSave] = useState(getSave());
  useEffect(() => setSave(getSave()), []);

  if (!ch) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="font-pixel text-sm">ไม่พบบทเรียนนี้ 😢</p>
        <Link href="/select" className="pixel-btn mt-6 inline-block rounded-sm bg-yellow-400 px-6 py-3 font-pixel text-xs text-[#23273a]">← กลับหน้าเลือกชั้น</Link>
      </main>
    );
  }

  const done = save.done[ch.id] ?? { game: false, mini: false, boss: false, quizBest: 0 };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="pixel-card flex flex-wrap items-center gap-3 bg-[#fff8e7] p-4">
        <span className="text-4xl">{ch.emoji}</span>
        <div>
          <p className="text-xs font-bold text-slate-500">{ch.grade} เล่ม {ch.book} บทที่ {ch.num}</p>
          <h1 className="text-xl font-extrabold">{ch.title}</h1>
        </div>
        <div className="ml-auto flex flex-wrap gap-2 text-xs font-bold">
          <span className={`rounded-sm border-2 px-2 py-1 ${done.game ? "border-green-700 bg-green-200" : "border-slate-300 bg-slate-100 text-slate-400"}`}>🏁 ด่าน {done.game ? "ผ่านแล้ว" : "ยังไม่ผ่าน"}</span>
          <span className={`rounded-sm border-2 px-2 py-1 ${done.mini ? "border-green-700 bg-green-200" : "border-slate-300 bg-slate-100 text-slate-400"}`}>🕹️ มินิเกม {done.mini ? "ผ่านแล้ว" : ""}</span>
          <span className={`rounded-sm border-2 px-2 py-1 ${done.boss ? "border-green-700 bg-green-200" : "border-slate-300 bg-slate-100 text-slate-400"}`}>🐲 บอส {done.boss ? "ปราบแล้ว" : ""}</span>
          {done.quizBest > 0 ? <span className="rounded-sm border-2 border-amber-700 bg-amber-200 px-2 py-1">🎯 สถิติ {done.quizBest}</span> : null}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {MODES.map((m, i) => {
          const passed = m.badge ? done[m.badge as "game" | "mini" | "boss"] : false;
          return (
            <motion.div key={m.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Link href={m.href(ch.id)} className={`pixel-card relative block h-full p-5 transition hover:-translate-y-1 ${m.color}`}>
                {passed ? <span className="absolute right-3 top-3 rounded-sm border-2 border-green-800 bg-green-400 px-2 py-0.5 text-[10px] font-extrabold text-green-950">✓ ผ่านแล้ว</span> : null}
                <p className="text-4xl">{m.icon}</p>
                <p className="mt-2 font-pixel text-[11px] leading-5 text-[#23273a]">{m.title}</p>
                <p className="mt-1.5 text-sm font-medium text-slate-800">{m.desc}</p>
              </Link>
            </motion.div>
          );
        })}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Link href="/formulas" className="pixel-card block h-full p-5 bg-white transition hover:-translate-y-1">
            <p className="text-4xl">📜</p>
            <p className="mt-2 font-pixel text-[11px] leading-5 text-[#23273a]">คลังสูตร</p>
            <p className="mt-1.5 text-sm font-medium text-slate-600">สูตรของบทนี้ + วิธีจำ + พิสูจน์ย่อ พร้อมค้นหา</p>
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
