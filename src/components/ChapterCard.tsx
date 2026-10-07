"use client";
// ChapterCard — การ์ดบทเรียนในหน้าเลือกเล่ม/บท (ทุกบทเปิดเรียนได้ ไม่ล็อก)
import Link from "next/link";
import { motion } from "framer-motion";
import type { Chapter } from "@/lib/types";
import { chapterStat, type GameState } from "@/lib/storage";

export default function ChapterCard({ chapter, state, index }: { chapter: Chapter; state: GameState; index: number }) {
  const st = chapterStat(state, chapter.id);
  const total = st.correct + st.wrong;
  const acc = total ? Math.round((st.correct / total) * 100) : 0;
  const cleared = state.cleared.includes(chapter.id);
  const badges = state.badges.filter((b) => b.chapterId === chapter.id).length;

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className="pixel-box relative overflow-hidden bg-[#1b1140] p-4"
      style={{ borderTopColor: chapter.color }}
    >
      <div className="absolute -right-6 -top-6 text-7xl opacity-15">{chapter.emoji}</div>

      <div className="mb-2 flex items-center gap-2">
        <span className="pixel-btn bg-[#0b0620] px-2 py-1 font-pixel text-[9px]" style={{ color: chapter.color }}>
          บท {chapter.no}
        </span>
        {cleared && <span className="pixel-btn bg-green-600 px-2 py-1 text-[10px] text-white">✔ ผ่านด่าน</span>}
        {badges > 0 && <span className="pixel-btn bg-[#fbd000] px-2 py-1 text-[10px] text-[#0b0620]">🏅 {badges}</span>}
      </div>

      <h3 className="mb-1 text-lg font-extrabold leading-tight" style={{ color: chapter.color }}>
        {chapter.emoji} {chapter.title}
      </h3>
      <p className="mb-3 text-xs text-white/60">{chapter.subtitle}</p>

      <div className="mb-3 flex flex-wrap gap-1 text-[11px]">
        <span className="border-2 border-white/20 px-1.5 py-0.5 text-white/70">โจทย์ {chapter.questions.length} ข้อ</span>
        <span className="border-2 border-white/20 px-1.5 py-0.5 text-white/70">สูตร {chapter.formulas.length}</span>
        <span className="border-2 border-white/20 px-1.5 py-0.5 text-white/70">แม่น {acc}%</span>
      </div>

      <p className="mb-3 border-l-4 bg-white/5 px-2 py-1 text-xs text-white/75" style={{ borderColor: chapter.color }}>
        🎮 มินิเกม: <b>{chapter.miniGame.title}</b>
      </p>

      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        <Link href={`/chapter/${chapter.id}/study`} className="pixel-btn bg-sky-500 px-2 py-2 text-center text-xs text-white">
          📖 เรียน
        </Link>
        <Link href={`/chapter/${chapter.id}/play`} className="pixel-btn bg-[#c84c0c] px-2 py-2 text-center text-xs text-white">
          🍄 ด่านเกม
        </Link>
        <Link href={`/chapter/${chapter.id}/minigame`} className="pixel-btn bg-fuchsia-600 px-2 py-2 text-center text-xs text-white">
          🕹️ มินิเกม
        </Link>
        <Link href={`/chapter/${chapter.id}/quiz`} className="pixel-btn bg-[#00a800] px-2 py-2 text-center text-xs text-white">
          📝 แบบทดสอบ
        </Link>
        <Link href={`/chapter/${chapter.id}/boss`} className="pixel-btn bg-red-700 px-2 py-2 text-center text-xs text-white">
          👹 บอส
        </Link>
        <Link href={`/chapter/${chapter.id}/mode`} className="pixel-btn bg-[#2a1a4a] px-2 py-2 text-center text-xs text-white">
          ⚙️ โหมดทั้งหมด
        </Link>
      </div>
    </motion.article>
  );
}
