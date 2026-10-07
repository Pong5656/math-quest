"use client";

// ===== หน้าเรียน "จับมือสอน" — การ์ดสเต็ปทีละใบ พร้อมอนิเมชันและแถบความคืบหน้า =====

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getChapter } from "@/data";
import MathText from "@/components/MathText";
import { bumpStreak } from "@/lib/store";
import { sfx } from "@/lib/sfx";

export default function StudyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const ch = getChapter(id);
  const [step, setStep] = useState(0);
  useEffect(() => {
    bumpStreak();
    window.scrollTo({ top: 0 });
  }, []);

  if (!ch) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="font-pixel text-sm">ไม่พบบทเรียนนี้ 😢</p>
        <Link href="/select" className="pixel-btn mt-6 inline-block rounded-sm bg-yellow-400 px-6 py-3 font-pixel text-xs text-[#23273a]">← กลับหน้าเลือกชั้น</Link>
      </main>
    );
  }

  const card = ch.study[step];
  const total = ch.study.length;
  const pct = ((step + 1) / total) * 100;

  const go = (d: number) => {
    sfx.click();
    setStep((s) => Math.max(0, Math.min(total - 1, s + d)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* หัวบทเรียน */}
      <div className="pixel-card bg-[#23273a] p-4 text-white sm:p-5">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{ch.emoji}</span>
          <div>
            <p className="text-xs text-slate-300">
              {ch.grade} เล่ม {ch.book} บทที่ {ch.num} · สอนแบบจับมือทีละสเต็ป
            </p>
            <h1 className="text-xl font-extrabold sm:text-2xl">{ch.title}</h1>
          </div>
        </div>
        <div className="mt-3 grid gap-1 sm:grid-cols-2">
          {ch.objectives.map((o) => (
            <p key={o} className="flex gap-1.5 text-xs text-slate-300">
              <span className="text-yellow-300">★</span>
              {o}
            </p>
          ))}
        </div>
      </div>

      {/* แถบความคืบหน้า */}
      <div className="mt-5">
        <div className="mb-1 flex justify-between text-xs font-bold text-slate-700">
          <span>สเต็ป {step + 1}/{total} — {card.icon} {card.title}</span>
          <span className="font-pixel text-[9px]">{Math.round(pct)}%</span>
        </div>
        <div className="h-4 rounded-sm border-4 border-[#23273a] bg-white">
          <motion.div
            className="h-full bg-gradient-to-r from-green-400 to-yellow-400"
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
      </div>

      {/* การ์ดสเต็ป (แต่ละสเต็ปพื้นหลังคนละโทน + เฟดอิน) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 26, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -18 }}
          transition={{ duration: 0.35 }}
          className={`pixel-card mt-5 p-5 sm:p-7 ${card.color}`}
        >
          <div className="flex items-center gap-3">
            <motion.span
              className="text-4xl sm:text-5xl"
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              {card.icon}
            </motion.span>
            <div>
              <p className="font-pixel text-[9px] text-slate-500">STEP {card.no}</p>
              <h2 className="text-xl font-extrabold sm:text-2xl">{card.title}</h2>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {card.lines.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.13 }}
                className={`rounded-sm border-2 border-black/10 bg-white/70 px-3 py-2.5 text-sm font-medium leading-6 sm:text-base ${
                  card.no === 2 ? "border-4 border-amber-700 bg-yellow-50" : ""
                }`}
              >
                <MathText text={line} />
              </motion.div>
            ))}
          </div>
          {/* กล่องเหลืองเน้นสูตรของสเต็ป 2 */}
          {card.no === 2 ? (
            <p className="mt-3 text-center text-xs font-bold text-amber-800">💾 สูตรในกล่องเหลืองคืออาวุธสำคัญ — จำไว้ใช้ตอนลุยด่าน!</p>
          ) : null}
        </motion.div>
      </AnimatePresence>

      {/* ปุ่มนำทาง */}
      <div className="mt-6 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={step === 0}
          className="pixel-btn rounded-sm bg-slate-200 px-5 py-3 font-pixel text-[10px] text-[#23273a]"
        >
          ← ย้อนกลับ
        </button>
        {step < total - 1 ? (
          <button type="button" onClick={() => go(1)} className="pixel-btn rounded-sm bg-yellow-400 px-6 py-3 font-pixel text-[10px] text-[#23273a]">
            ถัดไป ➜
          </button>
        ) : (
          <Link href={`/chapter/${ch.id}/mode`} className="pixel-btn rounded-sm bg-green-400 px-6 py-3 font-pixel text-[10px] text-[#23273a]">
            เข้าสู่ด่านเกม 🎮
          </Link>
        )}
      </div>

      {/* จุดหมายปลายทาง */}
      {step === total - 1 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="pixel-card mt-6 bg-white p-4 text-center"
        >
          <p className="text-sm font-bold text-slate-700">
            🎉 จบการปูพื้นฐาน! พร้อมแล้วไปลุย <span className="text-amber-700">ด่านมาริโอ</span>, <span className="text-fuchsia-700">มินิเกม</span>,{" "}
            <span className="text-sky-700">ตะลุยโจทย์</span> และ <span className="text-red-700">บอสใหญ่</span> ของบทนี้กันเลย
          </p>
        </motion.div>
      ) : null}
    </main>
  );
}
