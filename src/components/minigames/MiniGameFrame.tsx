"use client";
// ══════════════════════════════════════════════════════════
// MiniGameFrame — โครงมินิเกม (หัวเรื่อง / ความคืบหน้า / ชีวิต / คะแนน / จอสรุปผล)
// ══════════════════════════════════════════════════════════
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import Confetti from "@/components/Confetti";
import HeartBar from "@/components/HeartBar";

export interface MiniGameResult {
  win: boolean;
  correct: number;
  wrong: number;
  score: number;
  coins: number;
}

export default function MiniGameFrame({
  emoji,
  title,
  desc,
  round,
  total,
  lives,
  score,
  coins,
  result,
  onRestart,
  onExit,
  onNext,
  children,
}: {
  emoji: string;
  title: string;
  desc: string;
  round: number;
  total: number;
  lives: number;
  score: number;
  coins: number;
  result: MiniGameResult | null;
  onRestart: () => void;
  onExit: () => void;
  onNext?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      {/* หัวเกม */}
      <div className="pixel-box mb-3 bg-gradient-to-r from-fuchsia-700 to-indigo-800 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <motion.span animate={{ rotate: [0, -10, 10, 0] }} transition={{ repeat: Infinity, duration: 2.5 }} className="text-3xl">
            {emoji}
          </motion.span>
          <div>
            <h2 className="font-pixel text-[11px] text-[#fbd000] sm:text-xs">{title}</h2>
            <p className="text-[11px] text-white/75">{desc}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <HeartBar hearts={lives} max={3} label="" />
            <span className="pixel-box bg-[#0b0620] px-2 py-1 text-xs text-[#fbd000]">⭐ {score}</span>
            <span className="pixel-box bg-[#0b0620] px-2 py-1 text-xs text-white">🪙 {coins}</span>
          </div>
        </div>
        {/* แถบความคืบหน้า */}
        <div className="mt-2 h-3 w-full border-2 border-[#0b0620] bg-black/40">
          <motion.div
            className="h-full bg-[#fbd000]"
            animate={{ width: `${total ? (round / total) * 100 : 0}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
          />
        </div>
        <p className="mt-1 text-right font-pixel text-[9px] text-white/70">
          ROUND {Math.min(round + 1, total)}/{total}
        </p>
      </div>

      {/* เนื้อเกม */}
      <div className="pixel-box min-h-[280px] bg-[#120a26] p-3 sm:p-5">{children}</div>

      {/* จอสรุปผล */}
      {result && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/85 p-3">
          {result.win && <Confetti />}
          <motion.div initial={{ scale: 0.6, y: 40 }} animate={{ scale: 1, y: 0 }} className="pixel-box w-full max-w-md bg-[#1b1140] p-5 text-center">
            <p className="font-pixel text-sm text-[#fbd000]">{result.win ? "MISSION COMPLETE!" : "GAME OVER"}</p>
            <p className="mt-2 text-3xl">{result.win ? "🏆" : "💀"}</p>
            <p className="mt-2 text-sm text-white/85">
              ทำได้ {result.correct} ภารกิจ · พลาด {result.wrong} ครั้ง
            </p>
            <p className="mt-1 text-sm text-[#7CFC00]">คะแนน {result.score} · ได้รับเหรียญ {result.coins} 🪙</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button onClick={onRestart} className="pixel-btn bg-[#fbd000] px-4 py-2 text-xs text-[#0b0620]">
                🔁 เล่นอีกครั้ง
              </button>
              {onNext && (
                <button onClick={onNext} className="pixel-btn bg-[#00a800] px-4 py-2 text-xs text-white">
                  ➡️ ไปต่อ
                </button>
              )}
              <button onClick={onExit} className="pixel-btn bg-[#2a1a4a] px-4 py-2 text-xs text-white">
                🚪 ออกจากมินิเกม
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
