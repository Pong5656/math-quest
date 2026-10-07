"use client";
// ══════════════════════════════════════════════════════════
// หน้าสถิติ (/stats) — เหรียญ คะแนน Badge Streak (localStorage) + กระดานคะแนนจากเซิร์ฟเวอร์
// ══════════════════════════════════════════════════════════
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CHAPTERS, getChapter } from "@/data";
import { chapterStat } from "@/lib/storage";
import { fetchLeaderboard, useGameState } from "@/lib/useGameState";
import { sfx } from "@/lib/sound";

export default function StatsPage() {
  const { state, ready, update, reset } = useGameState();
  const [top, setTop] = useState<Array<Record<string, unknown>>>([]);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    void fetchLeaderboard().then(setTop);
  }, []);

  const totals = CHAPTERS.reduce(
    (acc, c) => {
      const s = chapterStat(state, c.id);
      acc.correct += s.correct;
      acc.wrong += s.wrong;
      acc.played += s.played;
      acc.score += s.bestScore;
      return acc;
    },
    { correct: 0, wrong: 0, played: 0, score: 0 },
  );
  const acc = totals.correct + totals.wrong > 0 ? Math.round((totals.correct / (totals.correct + totals.wrong)) * 100) : 0;

  const CARDS = [
    { icon: "🪙", label: "เหรียญที่เก็บได้ทั้งหมด", value: state.coins, color: "#fbd000" },
    { icon: "⭐", label: "คะแนนสะสม", value: state.score, color: "#7CFC00" },
    { icon: "🏅", label: "Badge ที่ปลดล็อก", value: state.badges.length, color: "#00e5ff" },
    { icon: "🔥", label: "Streak ปัจจุบัน (วัน)", value: state.streak, color: "#ff8a65" },
    { icon: "🚩", label: "ด่านที่พิชิตได้", value: state.cleared.length, color: "#c84c0c" },
    { icon: "🎯", label: "ความแม่นรวม", value: `${acc}%`, color: "#ba68c8" },
  ];

  return (
    <div className="space-y-4">
      <header className="pixel-box bg-gradient-to-r from-indigo-700 to-[#1b1140] p-4">
        <h1 className="font-pixel text-sm text-[#fbd000] sm:text-base">🏆 PLAYER STATS</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            value={state.name}
            onChange={(e) => update((s) => ({ ...s, name: e.target.value.slice(0, 24) }))}
            className="border-4 border-[#0b0620] bg-white px-2 py-1 text-sm text-[#1a1030] outline-none"
            placeholder="ชื่อผู้เล่น"
          />
          <span className="text-xs text-white/70">← ใส่ชื่อของคุณเพื่อขึ้นกระดานคะแนน (Streak สูงสุด: {state.bestStreak} วัน)</span>
        </div>
      </header>

      {/* การ์ดสถิติหลัก */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {CARDS.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06, type: "spring", stiffness: 260, damping: 16 }}
            className="pixel-box bg-[#120a26] p-3 text-center"
          >
            <p className="text-3xl">{c.icon}</p>
            <p className="mt-1 font-pixel text-sm" style={{ color: c.color }}>
              {ready ? c.value : "–"}
            </p>
            <p className="mt-1 text-[10px] leading-tight text-white/60">{c.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Badge ที่ปลดล็อก */}
      <section className="pixel-box bg-[#120a26] p-4">
        <h2 className="mb-3 font-pixel text-[11px] text-[#fbd000]">🏅 BADGE COLLECTION</h2>
        {state.badges.length === 0 ? (
          <p className="text-xs text-white/60">ยังไม่มี Badge — พิชิตด่านมาริโอหรือปราบบอสเพื่อรับเหรียญตราแรกของคุณ!</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {state.badges.map((b) => {
              const ch = getChapter(b.chapterId);
              return (
                <div key={b.id} className="pixel-box flex items-center gap-2 bg-[#1b1140] p-2">
                  <motion.span animate={{ rotate: [0, 8, -8, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="text-2xl">
                    🏅
                  </motion.span>
                  <div>
                    <p className="text-xs font-bold text-white">{b.name}</p>
                    <p className="text-[10px] text-white/60">
                      {ch?.title ?? b.chapterId} · {new Date(b.at).toLocaleDateString("th-TH")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* สถิติรายบท */}
      <section className="pixel-box bg-[#120a26] p-4">
        <h2 className="mb-3 font-pixel text-[11px] text-[#fbd000]">📊 สถิติรายบท ({CHAPTERS.length} บท)</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead>
              <tr className="border-b-4 border-[#0b0620] text-white/60">
                <th className="p-2">บท</th>
                <th className="p-2">เล่น</th>
                <th className="p-2">ถูก/ผิด</th>
                <th className="p-2">ความแม่น</th>
                <th className="p-2">คะแนนสูงสุด</th>
                <th className="p-2">บอส</th>
                <th className="p-2">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {CHAPTERS.map((c) => {
                const s = chapterStat(state, c.id);
                const t = s.correct + s.wrong;
                const a = t ? Math.round((s.correct / t) * 100) : 0;
                return (
                  <tr key={c.id} className="border-b-2 border-white/10 text-white/80">
                    <td className="p-2">
                      <Link href={`/chapter/${c.id}/mode`} className="hover:text-[#fbd000]">
                        {c.emoji} {c.title}
                      </Link>
                    </td>
                    <td className="p-2">{s.played}</td>
                    <td className="p-2">
                      <span className="text-green-400">{s.correct}</span>/<span className="text-red-400">{s.wrong}</span>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-16 border-2 border-[#0b0620] bg-black/40">
                          <div className="h-full bg-[#fbd000]" style={{ width: `${a}%` }} />
                        </div>
                        {a}%
                      </div>
                    </td>
                    <td className="p-2 text-[#7CFC00]">{s.bestScore}</td>
                    <td className="p-2 text-[#ff8a65]">{s.bossBest}</td>
                    <td className="p-2">{state.cleared.includes(c.id) ? "🚩 ผ่านด่าน" : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="text-[#fbd000]">
                <td className="p-2 font-bold">รวมทั้งหมด</td>
                <td className="p-2">{totals.played}</td>
                <td className="p-2">
                  {totals.correct}/{totals.wrong}
                </td>
                <td className="p-2">{acc}%</td>
                <td className="p-2">{totals.score}</td>
                <td className="p-2">—</td>
                <td className="p-2">{state.cleared.length}/{CHAPTERS.length}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* กระดานคะแนนจากเซิร์ฟเวอร์ */}
      <section className="pixel-box bg-[#120a26] p-4">
        <h2 className="mb-3 font-pixel text-[11px] text-[#fbd000]">🌐 GLOBAL LEADERBOARD (PostgreSQL)</h2>
        {top.length === 0 ? (
          <p className="text-xs text-white/60">ยังไม่มีคะแนนบนเซิร์ฟเวอร์ เล่นจบด่านแล้วคะแนนของคุณจะถูกส่งขึ้นมาที่นี่อัตโนมัติ</p>
        ) : (
          <ol className="space-y-1">
            {top.map((r, i) => (
              <li key={i} className="flex items-center gap-2 border-b-2 border-white/10 pb-1 text-xs">
                <span className="font-pixel text-[10px] text-[#fbd000]">#{i + 1}</span>
                <span className="text-white/90">{String(r.name)}</span>
                <span className="text-white/50">
                  {getChapter(String(r.chapterId))?.title ?? String(r.chapterId)} · {String(r.mode)}
                </span>
                <span className="ml-auto font-pixel text-[10px] text-[#7CFC00]">{String(r.score)}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* รีเซ็ต */}
      <section className="pixel-box bg-[#120a26] p-4 text-center">
        {confirmReset ? (
          <div>
            <p className="mb-2 text-xs text-white/80">แน่ใจหรือว่าจะลบความคืบหน้าทั้งหมด (เหรียญ คะแนน Badge สมุดข้อผิด)?</p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => {
                  reset();
                  setConfirmReset(false);
                  sfx.gameover();
                }}
                className="pixel-btn bg-red-700 px-4 py-2 text-xs text-white"
              >
                🗑️ ลบทั้งหมด
              </button>
              <button onClick={() => setConfirmReset(false)} className="pixel-btn bg-[#2a1a4a] px-4 py-2 text-xs text-white">
                ยกเลิก
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setConfirmReset(true)} className="pixel-btn bg-[#2a1a4a] px-4 py-2 text-xs text-white/80">
            🗑️ รีเซ็ตความคืบหน้าทั้งหมด
          </button>
        )}
      </section>
    </div>
  );
}
