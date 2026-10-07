"use client";

// ===== โมดัลถาม-ตอบหลัก ใช้ทั้งในเกมมาริโอ โหมดตะลุยโจทย์ และบอส =====

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Question } from "@/lib/types";
import MathText from "./MathText";
import { DiffPill } from "./ui";
import { sfx } from "@/lib/sfx";

type Phase = "answer" | "correct" | "explain";

export default function QuizModal({
  q,
  onCorrect,
  onWrong,
  timerSec,
  allowRetry = true,
  retryLeft = Infinity,
  hintCount = 0,
  onUseHint,
  coinReward = 10,
}: {
  q: Question;
  onCorrect: () => void;
  /** เรียกเมื่อตอบผิดหรือหมดเวลา (หักหัวใจภายนอก) */
  onWrong: () => void;
  /** ถ้ากำหนด จะจับเวลา (โหมดบอส) */
  timerSec?: number;
  /** ผิดแล้วตอบใหม่ได้ไหม (เกมมาริโอ = ได้) */
  allowRetry?: boolean;
  retryLeft?: number;
  hintCount?: number;
  onUseHint?: () => boolean;
  coinReward?: number;
}) {
  const [phase, setPhase] = useState<Phase>("answer");
  const [picked, setPicked] = useState<number | null>(null);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [hidden, setHidden] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(timerSec ?? 0);
  const [wrongCount, setWrongCount] = useState(0);

  // นับเวลาถอยหลัง (โหมดบอส)
  useEffect(() => {
    if (!timerSec || phase !== "answer") return;
    setTimeLeft(timerSec);
    const iv = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 0.25) {
          clearInterval(iv);
          handleTimeout();
          return 0;
        }
        return t - 0.25;
      });
    }, 250);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerSec, phase, q.id]);

  const letters = ["ก", "ข", "ค", "ง"];
  const pct = timerSec ? Math.max(0, (timeLeft / timerSec) * 100) : 0;
  const danger = timerSec ? timeLeft < 10 : false;

  // ตัดตัวเลือกผิด 2 ข้อ (ไอเทมน้ำยาใบ้)
  const hintOptions = useMemo(() => {
    const wrongs = q.ch.map((_, i) => i).filter((i) => i !== q.a);
    return wrongs.sort(() => Math.random() - 0.5).slice(0, 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.id]);

  function handleTimeout() {
    sfx.hit();
    setWrongFlash(true);
    setTimeout(() => setWrongFlash(false), 600);
    setPicked(-1);
    setPhase("explain");
    setWrongCount((c) => c + 1);
    onWrong();
  }

  function pick(i: number) {
    if (phase !== "answer" || hidden.includes(i)) return;
    setPicked(i);
    if (i === q.a) {
      sfx.correct();
      setPhase("correct");
    } else {
      sfx.wrong();
      setWrongFlash(true);
      setTimeout(() => setWrongFlash(false), 600);
      setWrongCount((c) => c + 1);
      setPhase("explain");
      onWrong();
    }
  }

  function useHint() {
    if (hintCount <= 0 || !onUseHint) return;
    if (onUseHint()) {
      sfx.powerup();
      setHidden(hintOptions);
    }
  }

  function retry() {
    sfx.click();
    setPicked(null);
    setPhase("answer");
  }

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          key={q.id + wrongCount /* รีเซ็ตอนิเมชันเมื่อเริ่มใหม่ */}
          initial={{ scale: 0.5, y: 40, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 16 }}
          className={`relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-sm border-4 border-[#23273a] bg-[#fff8e7] p-4 shadow-[8px_8px_0_rgba(0,0,0,0.45)] sm:p-6 ${
            wrongFlash ? "shake" : ""
          }`}
        >
          {wrongFlash ? <div className="pointer-events-none absolute inset-0 bg-red-400/40" /> : null}
          {phase === "correct" ? <div className="flash-green pointer-events-none absolute inset-0" /> : null}

          {/* หัวเรื่อง */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="font-pixel text-[10px] text-amber-700">❓ QUIZ BLOCK</span>
            <DiffPill lv={q.lv} />
            <span className="ml-auto rounded-sm border-2 border-amber-700 bg-amber-300 px-2 py-0.5 text-xs font-bold text-amber-900">
              🪙 +{coinReward}
            </span>
          </div>

          {/* แถบเวลาโหมดบอส */}
          {timerSec ? (
            <div className="mb-3">
              <div className="mb-1 flex justify-between text-xs font-bold">
                <span className={danger ? "text-red-600 blink-slow" : "text-slate-600"}>⏱ เวลาที่เหลือ</span>
                <span className={`font-pixel text-[10px] ${danger ? "text-red-600" : "text-slate-700"}`}>
                  {Math.ceil(timeLeft)} วิ
                </span>
              </div>
              <div className="h-3 w-full rounded-sm border-2 border-[#23273a] bg-slate-200">
                <div
                  className={`timebar h-full ${danger ? "bg-red-500" : "bg-green-500"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          ) : null}

          {/* โจทย์ */}
          <div className="mb-4 rounded-sm border-4 border-slate-300 bg-white p-3 text-base font-medium sm:text-lg">
            <MathText text={q.q} />
          </div>

          {/* ตัวเลือก */}
          {phase === "answer" ? (
            <div className="space-y-2">
              {q.ch.map((c, i) => {
                const off = hidden.includes(i);
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={off}
                    onClick={() => pick(i)}
                    className={`w-full rounded-sm border-4 px-3 py-2.5 text-left text-sm font-semibold transition sm:text-base ${
                      off
                        ? "border-slate-200 bg-slate-100 text-slate-300 line-through"
                        : "border-[#23273a] bg-sky-100 hover:-translate-y-0.5 hover:bg-yellow-200"
                    }`}
                  >
                    <span className="mr-2 font-pixel text-[10px] text-amber-700">{letters[i]}</span>
                    <MathText text={c} />
                  </button>
                );
              })}
              {hintCount > 0 && onUseHint && hidden.length === 0 ? (
                <button
                  type="button"
                  onClick={useHint}
                  className="pixel-btn mt-1 w-full rounded-sm bg-emerald-300 px-3 py-2 text-sm font-bold text-emerald-950"
                >
                  🧪 ใช้ยาใบ้ (ตัดตัวเลือกผิด 2 ข้อ) — เหลือ {hintCount} ขวด
                </button>
              ) : null}
            </div>
          ) : null}

          {/* ถูกต้อง */}
          {phase === "correct" ? (
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="rounded-sm border-4 border-green-700 bg-green-100 p-4 text-center"
            >
              <p className="font-pixel text-sm text-green-700">ถูกต้อง! 🎉</p>
              <motion.p
                className="mt-2 text-3xl"
                animate={{ y: [0, -10, 0], scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 0.9 }}
              >
                🪙
              </motion.p>
              <p className="mt-1 text-sm font-bold text-green-800">
                +{coinReward} เหรียญ · +{coinReward * 5} คะแนน
              </p>
              <button
                type="button"
                onClick={onCorrect}
                className="pixel-btn mt-3 rounded-sm bg-green-500 px-6 py-2 font-pixel text-[11px] text-white"
              >
                ไปต่อ ➜
              </button>
            </motion.div>
          ) : null}

          {/* เฉลยทีละขั้นหลังตอบผิด */}
          {phase === "explain" ? (
            <div className="space-y-3">
              <div className="rounded-sm border-4 border-red-600 bg-red-100 p-3 text-center">
                <p className="font-pixel text-xs text-red-700">ยังไม่ถูก! 💔 เสียหัวใจ 1 ดวง</p>
                <p className="mt-1 text-sm text-red-800">
                  เฉลยข้อ <span className="font-bold">{letters[q.a]}</span> — ดูวิธีทำทีละขั้นแล้วลองใหม่นะ!
                </p>
              </div>

              <div className="rounded-sm border-4 border-sky-700 bg-sky-50 p-3">
                <p className="mb-2 font-pixel text-[10px] text-sky-800">🧭 วิธีทำทีละขั้น</p>
                <ol className="space-y-1.5">
                  {q.steps.map((s, i) => {
                    const cols = ["text-sky-900", "text-emerald-800", "text-amber-800", "text-fuchsia-800", "text-rose-800"];
                    return (
                      <li key={i} className={`flex gap-2 text-sm font-medium ${cols[i % cols.length]}`}>
                        <span className="shrink-0 font-pixel text-[9px] leading-5">ขั้น {i + 1}</span>
                        <MathText text={s} />
                      </li>
                    );
                  })}
                </ol>
              </div>

              <div className="rounded-sm border-4 border-green-700 bg-green-100 p-3 text-sm">
                <span className="font-bold text-green-800">💡 ทริกคิดลัด: </span>
                <MathText text={q.trick} />
              </div>
              <div className="rounded-sm border-4 border-amber-700 bg-amber-100 p-3 text-sm">
                <span className="font-bold text-amber-800">📐 สูตรที่ใช้: </span>
                <MathText text={q.formula} />
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                {allowRetry && retryLeft > 0 ? (
                  <button
                    type="button"
                    onClick={retry}
                    className="pixel-btn rounded-sm bg-yellow-400 px-6 py-2.5 font-pixel text-[11px] text-[#23273a]"
                  >
                    🔄 ลองตอบอีกครั้ง
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onCorrect}
                    className="pixel-btn rounded-sm bg-sky-400 px-6 py-2.5 font-pixel text-[11px] text-[#23273a]"
                  >
                    เข้าใจแล้ว ไปต่อ ➜
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
