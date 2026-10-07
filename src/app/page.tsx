"use client";
// ══════════════════════════════════════════════════════════
// หน้าแรก — แบนเนอร์ 8-Bit + วิธีเล่น + ปุ่ม "เริ่มผจญภัย"
// ══════════════════════════════════════════════════════════
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { CHAPTERS, LEVELS, totalQuestions } from "@/data";
import { useGameState, fetchLeaderboard } from "@/lib/useGameState";
import { sfx } from "@/lib/sound";

const HOWTO = [
  { icon: "📖", title: "1. เรียนก่อน", desc: "เข้าหน้า “จับมือสอน” ทุกบทมี 6 สเต็ป เริ่มจากตัวอย่างใกล้ตัว → คอนเซปต์ → สูตร → ทำโจทย์ → ทริก → จุดพลาด" },
  { icon: "🍄", title: "2. เล่นด่านมาริโอ", desc: "เดิน กระโดด ชนบล็อก ? เพื่อตอบโจทย์ 4 ตัวเลือก ตอบถูกได้เหรียญ 🪙 ตอบผิดเสียหัวใจ ❤️ มีเห็ดฮีลเลือดและร้านซื้อไอเทมช่วย" },
  { icon: "🕹️", title: "3. เล่นมินิเกมประจำบท", desc: "ทุกบทมีมินิเกมเฉพาะตัว เช่น จัดกระเป๋าสายลับ (เซต), ถอดรหัสวงจรระเบิด (ตรรกศาสตร์), Soundwave DJ (ตรีโกณ)" },
  { icon: "👹", title: "4. ตะลุยโจทย์ + ปราบบอส", desc: "ทำแบบทดสอบประจำบทวัดความเข้าใจ แล้วท้าบอสท้ายบท: โจทย์ยากระดับข้อสอบจริง จับเวลา 45 วินาทีต่อข้อ" },
];

const FEATURES = [
  { icon: "🟢🟡🔴", t: "โจทย์ 3 ระดับ", d: `${totalQuestions}+ ข้อ ไล่จากชีวิตประจำวัน → ประยุกต์ 1 ขั้น → ยากแนว A-Level` },
  { icon: "✍️", t: "เฉลยทีละขั้น", d: "ทุกข้อมีวิธีทำเป็นบรรทัด พร้อมเหตุผล ทริกคิดลัด และสูตรที่ใช้" },
  { icon: "📚", t: "คลังสูตร", d: "ค้นหา + กรองตามบท พร้อมวิธีจำ (mnemonic) พิสูจน์ย่อ และตัวอย่าง" },
  { icon: "📓", t: "สมุดจดข้อผิด", d: "ข้อที่เคยผิดถูกเก็บอัตโนมัติ ทบทวนซ้ำแบบ spaced repetition" },
  { icon: "🏅", t: "Badge & Streak", d: "พิชิตด่านรับเหรียญตรา เล่นติดต่อกันสะสม streak" },
  { icon: "🔊", t: "เสียง 8-Bit", d: "เสียงกระโดด เหรียญ ตอบถูก/ผิด และ fanfare เมื่อชนะด่าน" },
];

export default function Home() {
  const { state, ready } = useGameState();
  const [top, setTop] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    void fetchLeaderboard().then(setTop);
  }, []);

  return (
    <div className="space-y-6">
      {/* ── แบนเนอร์ 8-Bit ── */}
      <section className="pixel-box sky-bg scanline relative overflow-hidden p-4 sm:p-8">
        {/* พื้นอิฐ + เมฆพิกเซลประดับ */}
        <div className="absolute inset-x-0 bottom-0 h-10 bg-[#c84c0c]" style={{ borderTop: "4px solid #0b0620" }} />
        <div className="absolute bottom-10 left-[8%] h-6 w-16 bg-white/80" />
        <div className="absolute bottom-[92px] left-[14%] h-6 w-10 bg-white/80" />
        <div className="absolute right-[12%] top-6 h-6 w-20 bg-white/70" />

        <div className="relative flex flex-col items-center gap-4 text-center">
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} className="text-5xl sm:text-6xl">
            🍄
          </motion.div>
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -24 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-pixel text-lg leading-relaxed text-[#0b0620] drop-shadow-[3px_3px_0_#fbd000] sm:text-3xl"
            >
              MATH QUEST
            </motion.h1>
            <p className="mt-2 text-base font-extrabold text-[#0b0620] sm:text-2xl">ผจญภัยคณิตศาสตร์ 8-Bit</p>
            <p className="mt-1 text-xs font-semibold text-[#123] sm:text-sm">
              คณิตศาสตร์เพิ่มเติม ม.ปลาย (ม.4–ม.6) · อิง สสวท. หลักสูตรแกนกลาง พ.ศ. 2551 (ปรับปรุง 2560) และ Project 14
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {LEVELS.map((l) => (
              <span key={l.id} className="pixel-btn px-3 py-1.5 text-xs text-[#0b0620]" style={{ background: l.color }}>
                {l.emoji} {l.name}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/select"
              onClick={() => sfx.power()}
              className="pixel-btn blink bg-[#c84c0c] px-6 py-4 text-sm text-white sm:px-10 sm:text-lg"
            >
              ▶ เริ่มผจญภัย
            </Link>
            <Link href="/formulas" className="pixel-btn bg-[#0b0620]/80 px-4 py-4 text-sm text-white sm:text-base">
              📚 คลังสูตร
            </Link>
            <Link href="/notebook" className="pixel-btn bg-[#0b0620]/80 px-4 py-4 text-sm text-white sm:text-base">
              📓 สมุดข้อผิด {ready && state.notebook.length > 0 ? `(${state.notebook.length})` : ""}
            </Link>
          </div>

          {ready && (
            <p className="font-pixel text-[10px] text-[#0b0620]">
              🪙 {state.coins} · ⭐ {state.score} · 🏅 {state.badges.length} · 🔥 STREAK {state.streak}
            </p>
          )}
        </div>
      </section>

      {/* ── วิธีเล่น ── */}
      <section>
        <h2 className="mb-3 font-pixel text-xs text-[#fbd000] sm:text-sm">▶ วิธีเล่น (HOW TO PLAY)</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {HOWTO.map((h, i) => (
            <motion.div
              key={h.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="pixel-box bg-[#1b1140] p-4"
            >
              <div className="mb-2 text-3xl">{h.icon}</div>
              <h3 className="mb-1 font-bold text-[#fbd000]">{h.title}</h3>
              <p className="text-xs leading-relaxed text-white/75">{h.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── จุดเด่น ── */}
      <section>
        <h2 className="mb-3 font-pixel text-xs text-[#fbd000] sm:text-sm">★ ในเกมนี้มีอะไร (FEATURES)</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.t} className="pixel-box bg-[#120a26] p-3">
              <p className="text-sm font-extrabold text-white">
                {f.icon} {f.t}
              </p>
              <p className="mt-1 text-xs text-white/70">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ภาพรวมเนื้อหา ── */}
      <section className="pixel-box bg-[#120a26] p-4">
        <h2 className="mb-3 font-pixel text-xs text-[#fbd000]">📖 เนื้อหา {CHAPTERS.length} บท ครบตาม สสวท.</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {LEVELS.map((l) => {
            const chs = CHAPTERS.filter((c) => c.level === l.id);
            return (
              <div key={l.id} className="border-4 border-[#0b0620] bg-[#1b1140] p-3">
                <p className="mb-1 font-bold" style={{ color: l.color }}>
                  {l.emoji} {l.name}
                </p>
                <ul className="mb-2 space-y-1 text-xs text-white/70">
                  {chs.map((c) => (
                    <li key={c.id}>
                      <Link href={`/chapter/${c.id}/study`} className="hover:text-[#fbd000]">
                        เล่ม {c.book} บท {c.no}: {c.title}
                      </Link>
                    </li>
                  ))}
                </ul>
                <p className="text-[11px] text-white/50">{l.desc}</p>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-center text-[11px] text-white/50">
          💡 ผู้เรียนเลือกเรียนบทใดก่อนก็ได้ ทุกบทเปิดให้เข้าเรียนทันที ไม่ล็อก ไม่บังคับลำดับ
        </p>
      </section>

      {/* ── กระดานคะแนนจากเซิร์ฟเวอร์ ── */}
      <section className="pixel-box bg-[#120a26] p-4">
        <h2 className="mb-3 font-pixel text-xs text-[#fbd000]">🏆 TOP PLAYERS (จากเซิร์ฟเวอร์)</h2>
        {top.length === 0 ? (
          <p className="text-xs text-white/60">ยังไม่มีคะแนนบนกระดาน — เป็นคนแรกที่พิชิตด่านเถอะ! 🎮</p>
        ) : (
          <ol className="space-y-1">
            {top.slice(0, 8).map((r, i) => (
              <li key={i} className="flex items-center gap-2 border-b-2 border-white/10 pb-1 text-xs">
                <span className="font-pixel text-[10px] text-[#fbd000]">{i + 1}</span>
                <span className="text-white/85">{String(r.name)}</span>
                <span className="text-white/50">{String(r.chapterId)} · {String(r.mode)}</span>
                <span className="ml-auto font-pixel text-[10px] text-[#7CFC00]">{String(r.score)}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
