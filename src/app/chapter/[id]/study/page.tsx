"use client";
// ══════════════════════════════════════════════════════════
// หน้าเรียน (/chapter/[id]/study) — สอนแบบจับมือทีละสเต็ป 6 สเต็ป
// สเต็ป 0 ตัวอย่างใกล้ตัว → 1 คอนเซปต์ → 2 กฎ/สูตร → 3 จับมือทำโจทย์ → 4 ทริก → 5 จุดพลาด
// ══════════════════════════════════════════════════════════
import Link from "next/link";
import { useParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { getChapter } from "@/data";
import StudyCard from "@/components/StudyCard";
import MathText from "@/lib/math";
import { sfx } from "@/lib/sound";

export default function StudyPage() {
  const params = useParams<{ id: string }>();
  const chapter = getChapter(params.id ?? "");
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);

  if (!chapter) {
    return (
      <div className="pixel-box bg-[#1b1140] p-6 text-center">
        <p className="font-pixel text-sm text-red-400">404 — ไม่พบบทเรียนนี้</p>
        <Link href="/select" className="pixel-btn mt-4 inline-block bg-[#fbd000] px-4 py-2 text-sm text-[#0b0620]">◀ กลับ</Link>
      </div>
    );
  }

  const steps = chapter.study;
  const cur = steps[Math.min(i, steps.length - 1)];
  const go = (n: number) => {
    setDir(n > i ? 1 : -1);
    setI(Math.max(0, Math.min(steps.length - 1, n)));
    sfx.bump();
  };

  return (
    <div className="space-y-4">
      {/* หัวบทเรียน + จุดประสงค์ตาม สสวท. */}
      <header className="pixel-box p-4" style={{ background: `linear-gradient(135deg, ${chapter.color}44, #1b1140)` }}>
        <div className="flex flex-wrap items-center gap-3">
          <motion.span animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="text-5xl">
            {chapter.emoji}
          </motion.span>
          <div>
            <p className="font-pixel text-[10px] text-white/60">
              ม.{chapter.level.replace("m", "")} เล่ม {chapter.book} · บทที่ {chapter.no}
            </p>
            <h1 className="text-xl font-extrabold sm:text-2xl" style={{ color: chapter.color }}>
              {chapter.title}
            </h1>
            <p className="text-xs text-white/70">{chapter.subtitle}</p>
          </div>
          <div className="ml-auto flex gap-2">
            <Link href={`/select/${chapter.level}`} className="pixel-btn bg-[#0b0620] px-3 py-2 text-xs text-white">◀ บทอื่น</Link>
            <Link href={`/chapter/${chapter.id}/mode`} className="pixel-btn bg-[#fbd000] px-3 py-2 text-xs text-[#0b0620]">⚙️ โหมด</Link>
          </div>
        </div>

        <div className="mt-3 border-4 border-[#0b0620] bg-black/25 p-3">
          <p className="mb-1 font-pixel text-[10px] text-[#fbd000]">🎯 จุดประสงค์การเรียนรู้ (ตาม สสวท.)</p>
          <ul className="grid gap-1 text-xs text-white/85 sm:grid-cols-2">
            {chapter.objectives.map((o, k) => (
              <li key={k} className="flex gap-1">
                <span className="text-[#fbd000]">▸</span>
                <span>
                  <MathText>{o}</MathText>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </header>

      {/* แถบความคืบหน้า + ปุ่มนำทางสเต็ป */}
      <div className="pixel-box bg-[#120a26] p-3">
        <div className="mb-2 flex items-center gap-2">
          <span className="font-pixel text-[10px] text-white/70">STEP {i + 1}/{steps.length}</span>
          <div className="h-3 flex-1 border-2 border-[#0b0620] bg-black/40">
            <motion.div className="h-full bg-[#fbd000]" animate={{ width: `${((i + 1) / steps.length) * 100}%` }} transition={{ type: "spring", stiffness: 130, damping: 20 }} />
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {steps.map((s, k) => (
            <button key={s.key} onClick={() => go(k)} className={`pixel-btn px-2 py-1.5 text-[11px] ${k === i ? "bg-[#fbd000] text-[#0b0620]" : "bg-[#2a1a4a] text-white/80"}`}>
              {s.icon} <span className="hidden sm:inline">{s.title.replace(/^[^-]*—\s*/, "").slice(0, 18)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* การ์ดสเต็ปปัจจุบัน */}
      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={cur.key}
          custom={dir}
          initial={{ opacity: 0, x: dir * 80 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: dir * -80 }}
          transition={{ duration: 0.35, ease: [0.2, 0.9, 0.3, 1] }}
        >
          <StudyCard step={cur} index={i} total={steps.length} />
        </motion.div>
      </AnimatePresence>

      {/* ปุ่ม ถัดไป / ย้อนกลับ */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => go(i - 1)} disabled={i === 0} className="pixel-btn bg-[#2a1a4a] px-5 py-3 text-sm text-white">
          ◀ ย้อนกลับ
        </button>
        {i < steps.length - 1 ? (
          <button onClick={() => go(i + 1)} className="pixel-btn flex-1 bg-[#00a800] px-5 py-3 text-sm text-white">
            ถัดไป ▶ ({steps[i + 1].icon} {steps[i + 1].title})
          </button>
        ) : (
          <div className="flex-1">
            <Link href={`/chapter/${chapter.id}/mode`} className="pixel-btn block w-full bg-[#c84c0c] px-5 py-4 text-center text-sm text-white sm:text-base">
              🎮 เข้าสู่ด่านเกม — {chapter.title}
            </Link>
          </div>
        )}
      </div>

      {/* สูตรย่อของบทนี้ + มินิเกมประจำบท */}
      <section className="grid gap-3 lg:grid-cols-2">
        <div className="pixel-box bg-[#120a26] p-4">
          <h2 className="mb-2 font-pixel text-[11px] text-[#fbd000]">📏 สูตรประจำบท ({chapter.formulas.length})</h2>
          <ul className="space-y-2">
            {chapter.formulas.map((f) => (
              <li key={f.id} className="border-l-4 bg-white/5 px-2 py-1.5" style={{ borderColor: chapter.color }}>
                <p className="text-xs font-bold text-white">{f.name}</p>
                <p className="text-[13px] text-white/80">
                  <MathText>{`\\[${f.tex}\\]`}</MathText>
                </p>
                <p className="text-[11px] text-white/60">🧠 {f.memory}</p>
              </li>
            ))}
          </ul>
          <Link href="/formulas" className="pixel-btn mt-3 inline-block bg-[#2a1a4a] px-3 py-2 text-xs text-white">
            📚 เปิดคลังสูตรทั้งหมด
          </Link>
        </div>

        <div className="pixel-box bg-[#120a26] p-4">
          <h2 className="mb-2 font-pixel text-[11px] text-[#fbd000]">🕹️ มินิเกมประจำบท</h2>
          <div className="border-4 border-[#0b0620] p-3" style={{ background: `${chapter.color}33` }}>
            <p className="text-base font-extrabold text-white">{chapter.miniGame.title}</p>
            <p className="mt-1 text-xs text-white/85">{chapter.miniGame.desc}</p>
          </div>
          <h2 className="mb-2 mt-4 font-pixel text-[11px] text-[#fbd000]">👹 บอสท้ายบท</h2>
          <div className="border-4 border-[#0b0620] bg-red-900/30 p-3">
            <p className="text-base font-extrabold text-red-300">{chapter.bossName}</p>
            <p className="mt-1 text-xs text-white/85">{chapter.bossIntro}</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/chapter/${chapter.id}/minigame`} className="pixel-btn bg-fuchsia-600 px-3 py-2 text-xs text-white">🕹️ เล่นมินิเกม</Link>
            <Link href={`/chapter/${chapter.id}/quiz`} className="pixel-btn bg-[#00a800] px-3 py-2 text-xs text-white">📝 แบบทดสอบ</Link>
            <Link href={`/chapter/${chapter.id}/boss`} className="pixel-btn bg-red-700 px-3 py-2 text-xs text-white">👹 สู้บอส</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
