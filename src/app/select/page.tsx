"use client";
// หน้าเลือกชั้นเรียน ม.4 / ม.5 / ม.6
import Link from "next/link";
import { motion } from "framer-motion";
import { CHAPTERS, LEVELS } from "@/data";
import { useGameState } from "@/lib/useGameState";

export default function SelectLevel() {
  const { state, ready } = useGameState();
  return (
    <div>
      <header className="pixel-box mb-4 bg-gradient-to-r from-indigo-700 to-purple-800 p-4 text-center">
        <h1 className="font-pixel text-sm text-[#fbd000] sm:text-base">SELECT YOUR GRADE</h1>
        <p className="mt-2 text-sm text-white/80">เลือกชั้นเรียนของคุณ — ทุกบทเปิดให้เรียนทันที ไม่มีการล็อก 🎓</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {LEVELS.map((l, i) => {
          const chs = CHAPTERS.filter((c) => c.level === l.id);
          const cleared = chs.filter((c) => state.cleared.includes(c.id)).length;
          const qs = chs.reduce((s, c) => s + c.questions.length, 0);
          return (
            <motion.div key={l.id} initial={{ opacity: 0, y: 34 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Link href={`/select/${l.id}`} className="pixel-box block h-full bg-[#1b1140] p-5 transition hover:-translate-y-1">
                <div className="mb-3 flex items-center gap-3">
                  <motion.span animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="text-5xl">
                    {l.emoji}
                  </motion.span>
                  <div>
                    <p className="font-pixel text-xs" style={{ color: l.color }}>
                      WORLD {i + 1}
                    </p>
                    <h2 className="text-lg font-extrabold text-white">{l.name}</h2>
                  </div>
                </div>
                <p className="mb-3 text-xs leading-relaxed text-white/70">{l.desc}</p>
                <div className="flex flex-wrap gap-1 text-[11px]">
                  <span className="border-2 border-white/25 px-2 py-0.5 text-white/75">{chs.length} บท</span>
                  <span className="border-2 border-white/25 px-2 py-0.5 text-white/75">{qs} ข้อ</span>
                  <span className="border-2 border-white/25 px-2 py-0.5 text-white/75">{chs.length} มินิเกม</span>
                  {ready && <span className="border-2 border-green-500 px-2 py-0.5 text-green-300">ผ่านด่าน {cleared}/{chs.length}</span>}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <p className="mt-4 text-center text-xs text-white/50">
        เนื้อหาแบ่งตามหนังสือเรียน สสวท. รายวิชาคณิตศาสตร์เพิ่มเติม (เล่ม 1 และ เล่ม 2 ของแต่ละชั้น)
      </p>
    </div>
  );
}
