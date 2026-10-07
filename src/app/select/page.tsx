"use client";

// ===== หน้าเลือกชั้น ม.4 / ม.5 / ม.6 =====

import Link from "next/link";
import { motion } from "framer-motion";
import { LEVELS } from "@/data";
import { chaptersOf } from "@/data";
import { getSave } from "@/lib/store";
import { useEffect, useState } from "react";

export default function SelectPage() {
  const [save, setSave] = useState(getSave());
  useEffect(() => setSave(getSave()), []);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-center font-pixel text-sm leading-6 text-[#23273a] sm:text-lg">เลือกชั้นเรียน 🎓</h1>
      <p className="mt-2 text-center text-sm font-medium text-slate-700 sm:text-base">
        เนื้อหาอิงหลักสูตร สสวท. แกนกลาง 2551 (ปรับปรุง 2560) และ Project 14 — เลือกบทเรียนได้อิสระ ไม่ล็อก ไม่บังคับลำดับ!
      </p>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {LEVELS.map((lv, i) => {
          const chs = [...chaptersOf(lv.id, 1), ...chaptersOf(lv.id, 2)];
          const doneGame = chs.filter((c) => save.done[c.id]?.game).length;
          const doneBoss = chs.filter((c) => save.done[c.id]?.boss).length;
          return (
            <motion.div
              key={lv.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12 }}
            >
              <Link
                href={`/select/${lv.id}`}
                className={`pixel-card block p-5 transition hover:-translate-y-1 ${lv.color}`}
              >
                <p className="text-4xl">{lv.emoji}</p>
                <p className="mt-3 font-pixel text-xs leading-5 text-[#23273a]">{lv.label}</p>
                <p className="mt-2 min-h-[3.5rem] text-sm font-semibold text-slate-800">{lv.desc}</p>
                <div className="mt-3 flex items-center justify-between rounded-sm border-2 border-[#23273a] bg-white/80 px-3 py-2 text-xs font-bold">
                  <span>📚 {chs.length} บท</span>
                  <span>🏁 ด่าน {doneGame}/{chs.length}</span>
                  <span>⚔️ บอส {doneBoss}/{chs.length}</span>
                </div>
                <p className="mt-3 text-center font-pixel text-[10px] text-[#23273a]">กดเพื่อเข้าเรียน ➜</p>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="pixel-card mx-auto mt-10 max-w-2xl bg-[#fff8e7] p-4 text-center">
        <p className="text-sm font-semibold text-slate-700">
          💡 คำแนะนำ: เข้าหน้าเรียน (/study) ของแต่ละบทก่อน เพื่อปูพื้นฐานแบบจับมือทำ แล้วค่อยลุยด่านเกมและบอส จะสนุกที่สุด!
        </p>
      </div>
    </main>
  );
}
