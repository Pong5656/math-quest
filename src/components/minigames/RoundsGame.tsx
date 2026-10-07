"use client";
// ══════════════════════════════════════════════════════════
// RoundsGame — เอนจินมินิเกมแบบ "ภารกิจเป็นรอบ" (สุ่มโจทย์คณิตของบทนั้นใหม่ทุกครั้ง)
// ใช้กับมินิเกมส่วนใหญ่ เช่น Interval Runner, Outbreak, Conic Tower, Moneyball, Reactor-Z ฯลฯ
// ══════════════════════════════════════════════════════════
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Chapter } from "@/lib/types";
import { generateRounds, type MgRound } from "@/lib/minigameData";
import MathText from "@/lib/math";
import { sfx } from "@/lib/sound";
import MiniGameFrame, { type MiniGameResult } from "./MiniGameFrame";

export interface Theme {
  stage: string; // อีโมจิฉาก
  bg: string; // คลาสพื้นหลังฉาก
  hint: string;
}

export default function RoundsGame({
  chapter,
  theme,
  rounds = 6,
  onFinish,
  onRestart,
  onExit,
  onNext,
}: {
  chapter: Chapter;
  theme: Theme;
  rounds?: number;
  onFinish: (r: MiniGameResult) => void;
  onRestart: () => void;
  onExit: () => void;
  onNext?: () => void;
}) {
  const [seed, setSeed] = useState(0);
  const data = useMemo<MgRound[]>(() => generateRounds(chapter.miniGame.kind, rounds), [chapter.miniGame.kind, rounds, seed]);
  const [idx, setIdx] = useState(0);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [result, setResult] = useState<MiniGameResult | null>(null);

  const round = data[Math.min(idx, data.length - 1)];

  useEffect(() => {
    if (idx >= data.length || lives <= 0) {
      const win = lives > 0;
      const res = { win, correct, wrong, score: score + (win ? 100 : 0), coins: coins + (win ? 25 : 0) };
      setResult(res);
      onFinish(res);
      if (win) sfx.fanfare();
      else sfx.gameover();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, lives]);

  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === round.answer) {
      sfx.correct();
      setScore((s) => s + 50);
      setCoins((c) => c + 5);
      setCorrect((c) => c + 1);
    } else {
      sfx.wrong();
      setLives((l) => l - 1);
      setWrong((w) => w + 1);
    }
  };

  const next = () => {
    setPicked(null);
    setIdx((v) => v + 1);
  };

  const restart = () => {
    setIdx(0);
    setLives(3);
    setScore(0);
    setCoins(0);
    setCorrect(0);
    setWrong(0);
    setPicked(null);
    setResult(null);
    setSeed((s) => s + 1);
    onRestart();
  };

  return (
    <MiniGameFrame
      emoji={chapter.emoji}
      title={chapter.miniGame.title}
      desc={chapter.miniGame.desc}
      round={idx}
      total={data.length}
      lives={lives}
      score={score}
      coins={coins}
      result={result}
      onRestart={restart}
      onExit={onExit}
      onNext={onNext}
    >
      {/* ฉากของเกม */}
      <div className={`relative mb-4 flex h-32 items-center justify-center overflow-hidden border-4 border-[#0b0620] bg-gradient-to-b ${theme.bg}`}>
        <motion.span
          key={`${idx}-${picked === null ? "a" : "b"}`}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, y: [0, -8, 0] }}
          transition={{ duration: 0.5, y: { repeat: Infinity, duration: 2 } }}
          className="text-6xl drop-shadow-[4px_4px_0_#0b0620]"
        >
          {theme.stage}
        </motion.span>
        <span className="absolute bottom-1 left-2 font-pixel text-[9px] text-white/80">{theme.hint}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${seed}-${idx}`}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.28 }}
        >
          <div className="mb-3 border-4 border-[#0b0620] bg-white p-3 text-[15px] leading-relaxed text-[#1a1030]">
            <MathText>{round.prompt}</MathText>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {round.options.map((o, i) => {
              const isAns = i === round.answer;
              let cls = "bg-[#2a1a4a] hover:bg-[#3d2a6b] text-white";
              if (picked !== null) {
                if (isAns) cls = "bg-green-600 text-white";
                else if (picked === i) cls = "bg-red-600 text-white";
                else cls = "bg-[#241a3a] text-white/40";
              }
              return (
                <button key={i} disabled={picked !== null} onClick={() => choose(i)} className={`pixel-btn px-3 py-3 text-left text-sm ${cls} ${picked === i && !isAns ? "shake" : ""}`}>
                  <span className="font-pixel mr-2 text-[10px] text-[#fbd000]">{["A", "B", "C", "D"][i]}</span>
                  <MathText>{o}</MathText>
                </button>
              );
            })}
          </div>

          {picked !== null && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-3 border-4 border-[#0b0620] p-3 text-sm ${picked === round.answer ? "bg-green-700" : "bg-red-700"} text-white`}
            >
              <p className="font-pixel text-[10px]">{picked === round.answer ? "ภารกิจสำเร็จ! ✅ +50" : "พลาดแล้ว 💔"}</p>
              <p className="mt-1 text-white/90">
                <MathText>{round.explain}</MathText>
              </p>
              <button onClick={next} className="pixel-btn mt-2 w-full bg-[#fbd000] px-3 py-2 text-xs text-[#0b0620]">
                ▶ ภารกิจถัดไป
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </MiniGameFrame>
  );
}
