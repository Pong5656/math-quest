"use client";

// ===== หน้าสถิติ: เหรียญ คะแนน แบดจ์ สตรีค และความคืบหน้าแต่ละบท =====

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ALL_CHAPTERS, badgeInfo } from "@/data";
import { getSave } from "@/lib/store";

export default function StatsPage() {
  const [save, setSave] = useState(getSave());
  useEffect(() => setSave(getSave()), []);

  const { coins, score, streak, badges, answered, correct } = save.stats;
  const acc = answered > 0 ? Math.round((correct / answered) * 100) : 0;
  const totalModes = ALL_CHAPTERS.length * 3; // ด่าน + มินิเกม + บอส
  const doneModes = ALL_CHAPTERS.reduce((s, c) => {
    const d = save.done[c.id];
    return s + (d?.game ? 1 : 0) + (d?.mini ? 1 : 0) + (d?.boss ? 1 : 0);
  }, 0);

  const cards = [
    { icon: "🪙", label: "เหรียญสะสม", value: coins, color: "bg-amber-300" },
    { icon: "⭐", label: "คะแนนรวม", value: score, color: "bg-yellow-300" },
    { icon: "🔥", label: "สตรีค (วันติดกัน)", value: streak, color: "bg-orange-300" },
    { icon: "🎯", label: "ความแม่นยำ", value: `${acc}%`, color: "bg-green-300" },
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-center font-pixel text-sm leading-6 text-[#23273a] sm:text-lg">🏆 สถิติการผจญภัย</h1>
      <p className="mt-2 text-center text-sm font-medium text-slate-700">
        ตอบแล้ว {answered} ข้อ · ถูก {correct} ข้อ · ปลดล็อกโหมด {doneModes}/{totalModes}
      </p>

      {/* การ์ดสถิติหลัก */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`pixel-card p-4 text-center ${c.color}`}
          >
            <p className="text-3xl">{c.icon}</p>
            <p className="mt-2 font-pixel text-base text-[#23273a]">{c.value}</p>
            <p className="mt-1 text-xs font-bold text-slate-700">{c.label}</p>
          </motion.div>
        ))}
      </div>

      {/* แบดจ์ */}
      <section className="mt-10">
        <h2 className="font-pixel text-xs leading-5 text-[#23273a]">🏅 แบดจ์ที่ปลดล็อกแล้ว ({badges.length})</h2>
        {badges.length === 0 ? (
          <div className="pixel-card mt-3 bg-white p-5 text-center text-sm font-semibold text-slate-600">
            ยังไม่มีแบดจ์ — ผ่านด่านมาริโอ มินิเกม หรือบอสของบทใดก็ได้ เพื่อรับแบดจ์แรก!
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {badges.map((b, i) => {
              const info = badgeInfo(b);
              return (
                <motion.div
                  key={b}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: Math.min(i * 0.05, 0.5) }}
                  className="pixel-card bg-[#fff8e7] p-3 text-center"
                >
                  <p className="text-3xl">{info.emoji}</p>
                  <p className="mt-1.5 text-xs font-extrabold">{info.label}</p>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* ความคืบหน้ารายบท */}
      <section className="mt-10">
        <h2 className="font-pixel text-xs leading-5 text-[#23273a]">🗺️ แผนที่การผจญภัยรายบท</h2>
        <div className="pixel-card mt-3 overflow-x-auto bg-white">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b-4 border-[#23273a] bg-[#23273a] text-left text-white">
                <th className="px-3 py-2 font-pixel text-[9px]">บทเรียน</th>
                <th className="px-3 py-2 text-center text-xs">🏁 ด่าน</th>
                <th className="px-3 py-2 text-center text-xs">🕹️ มินิเกม</th>
                <th className="px-3 py-2 text-center text-xs">🐲 บอส</th>
                <th className="px-3 py-2 text-center text-xs">🎯 คะแนนสูงสุด</th>
              </tr>
            </thead>
            <tbody>
              {ALL_CHAPTERS.map((ch) => {
                const d = save.done[ch.id] ?? { game: false, mini: false, boss: false, quizBest: 0 };
                const cell = (ok: boolean) => (
                  <td className="border-b-2 border-slate-200 px-3 py-2 text-center">
                    {ok ? <span className="font-extrabold text-green-600">✔</span> : <span className="text-slate-300">—</span>}
                  </td>
                );
                return (
                  <tr key={ch.id} className="hover:bg-yellow-50">
                    <td className="border-b-2 border-slate-200 px-3 py-2 font-semibold">
                      {ch.emoji} {ch.grade} ล.{ch.book} · {ch.short}
                    </td>
                    {cell(d.game)}
                    {cell(d.mini)}
                    {cell(d.boss)}
                    <td className="border-b-2 border-slate-200 px-3 py-2 text-center font-bold">{d.quizBest > 0 ? d.quizBest : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
