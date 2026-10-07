"use client";
// ══════════════════════════════════════════════════════════
// QuizModal — โมดัลคำถามที่ใช้ร่วมกันทั้งเกมมาริโอ / แบบทดสอบ / บอส / ทบทวน
//  • เปิดแบบ pop-in + bounce
//  • ตอบถูก: วาบเขียว + เหรียญเด้ง + "ถูกต้อง! 🎉"
//  • ตอบผิด: shake + วาบแดง + เฉลยทีละขั้น + ทริก แล้วตอบใหม่ได้
//  • แถบเวลา: ลดแบบ smooth และเปลี่ยนเป็นสีแดงเมื่อเหลือ < 10 วินาที
// ══════════════════════════════════════════════════════════
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import type { Question } from "@/lib/types";
import { DIFF_META } from "@/data";
import MathText from "@/lib/math";
import { sfx } from "@/lib/sound";

export interface QuizModalProps {
  question: Question | null;
  open: boolean;
  title?: string;
  /** เวลาคิดเป็นวินาที (0 = ไม่จับเวลา) */
  timeLimit?: number;
  /** อนุญาตให้ใช้ไอเทม "ตัด 2 ช้อยส์" */
  hintLeft?: number;
  onUseHint?: (q: Question, eliminated: number[]) => void;
  /** ตอบผิดแล้วให้ลองตอบใหม่ได้ (โหมดเกมมาริโอ) */
  allowRetry?: boolean;
  /** คะแนนเหรียญที่ได้เมื่อตอบถูก */
  coinReward?: number;
  onAnswer: (correct: boolean, firstTry: boolean, attempts: number) => void;
  onClose: () => void;
}

export default function QuizModal(p: QuizModalProps) {
  const { question, open } = p;
  const [selected, setSelected] = useState<number | null>(null);
  const [phase, setPhase] = useState<"answer" | "correct" | "wrong" | "timeout">("answer");
  const [attempts, setAttempts] = useState(0);
  const [time, setTime] = useState(p.timeLimit ?? 0);
  const [eliminated, setEliminated] = useState<number[]>([]);

  const limit = p.timeLimit ?? 0;

  // รีเซ็ตสถานะทุกครั้งที่โจทย์เปลี่ยน
  useEffect(() => {
    if (!open || !question) return;
    setSelected(null);
    setPhase("answer");
    setAttempts(0);
    setTime(limit);
    setEliminated([]);
  }, [open, question?.id, limit]);

  // ตัวจับเวลา (ลดทีละ 0.1 วินาทีเพื่อให้แถบเวลาไหลลื่น)
  useEffect(() => {
    if (!open || limit <= 0 || phase !== "answer") return;
    const t = setInterval(() => {
      setTime((v) => {
        const nv = Math.max(0, +(v - 0.1).toFixed(1));
        if (nv === 0) setPhase("timeout");
        return nv;
      });
    }, 100);
    return () => clearInterval(t);
  }, [open, limit, phase]);

  // เสียงติ๊ก ๆ เมื่อเวลาใกล้หมด
  useEffect(() => {
    if (limit > 0 && phase === "answer" && time > 0 && time < 10 && Math.abs(time % 1) < 0.05) sfx.tick();
  }, [time, phase, limit]);

  if (!question) return null;
  const meta = DIFF_META[question.diff];

  const choose = (i: number) => {
    if (phase !== "answer" || eliminated.includes(i)) return;
    setSelected(i);
    const ok = i === question.answer;
    setAttempts((a) => a + 1);
    if (ok) {
      setPhase("correct");
      sfx.correct();
      sfx.coin();
    } else {
      setPhase("wrong");
      sfx.wrong();
    }
  };

  const useHint = () => {
    if (!p.hintLeft || p.hintLeft <= 0 || phase !== "answer" || eliminated.length) return;
    // สุ่มตัดช้อยส์ผิดออก 2 ตัว
    const wrongs = [0, 1, 2, 3].filter((i) => i !== question.answer);
    const cut = wrongs.sort(() => Math.random() - 0.5).slice(0, 2);
    setEliminated(cut);
    sfx.power();
    p.onUseHint?.(question, cut);
  };

  const retry = () => {
    setSelected(null);
    setPhase("answer");
    setTime(limit > 0 ? limit : 0);
  };

  const finish = (ok: boolean) => p.onAnswer(ok, attempts === 1 && ok, attempts);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-2 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.55, y: 60, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 30, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 18, mass: 0.7 }}
            className={`pixel-box relative max-h-[92vh] w-full max-w-2xl overflow-y-auto bg-[#1b1140] p-4 sm:p-6 ${
              phase === "wrong" || phase === "timeout" ? "shake" : ""
            }`}
            style={{ borderColor: phase === "correct" ? "#00a800" : phase === "wrong" || phase === "timeout" ? "#c0392b" : "#0b0620" }}
          >
            {/* แสงวาบตามผลคำตอบ */}
            {phase === "correct" && <div className="pointer-events-none absolute inset-0 animate-pulse bg-green-400/25" />}
            {(phase === "wrong" || phase === "timeout") && <div className="pointer-events-none absolute inset-0 bg-red-500/20" />}

            {/* หัวข้อโมดัล */}
            <div className="relative mb-3 flex flex-wrap items-center gap-2">
              <span className={`pixel-btn px-2 py-1 text-[11px] text-white ${meta.bg}`}>
                {meta.dot} {meta.label}
              </span>
              <span className="font-pixel text-[10px] text-[#fbd000]">{p.title ?? "QUIZ"}</span>
              <span className="ml-auto font-pixel text-[10px] text-white/70">ครั้งที่ {attempts + (phase === "answer" ? 1 : 0)}</span>
              {limit > 0 && phase === "answer" && (
                <span className={`font-pixel text-[11px] ${time < 10 ? "blink text-red-400" : "text-white"}`}>⏱ {time.toFixed(1)}</span>
              )}
            </div>

            {/* แถบเวลา */}
            {limit > 0 && (
              <div className="relative mb-3 h-3 w-full border-2 border-[#0b0620] bg-[#2a1a4a]">
                <motion.div
                  className={`h-full ${time < 10 ? "bg-red-500" : "bg-[#fbd000]"}`}
                  animate={{ width: `${(time / limit) * 100}%` }}
                  transition={{ ease: "linear", duration: 0.12 }}
                />
              </div>
            )}

            {/* เนื้อโจทย์ */}
            <div className="relative mb-4 border-4 border-[#0b0620] bg-white/95 p-3 text-[15px] leading-relaxed text-[#1a1030] sm:p-4">
              <MathText>{question.q}</MathText>
            </div>

            {/* ตัวเลือก */}
            <div className="relative grid gap-2 sm:grid-cols-2">
              {question.options.map((opt, i) => {
                const isAns = i === question.answer;
                const chosen = selected === i;
                const dead = eliminated.includes(i);
                let cls = "bg-[#2a1a4a] text-white hover:bg-[#3d2a6b]";
                if (phase !== "answer" && isAns) cls = "bg-green-600 text-white";
                else if (chosen && !isAns) cls = "bg-red-600 text-white";
                if (dead) cls = "bg-[#241a3a] text-white/25 line-through";
                return (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.97 }}
                    disabled={phase !== "answer" || dead}
                    onClick={() => choose(i)}
                    className={`pixel-btn flex items-start gap-2 px-3 py-3 text-left text-sm ${cls}`}
                  >
                    <span className="font-pixel text-[11px] text-[#fbd000]">{["A", "B", "C", "D"][i]}</span>
                    <span className="flex-1">
                      <MathText>{opt}</MathText>
                    </span>
                    {phase === "correct" && chosen && (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: [0, 1.5, 1] }} className="text-lg">
                        ✅
                      </motion.span>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* ปุ่มไอเทมช่วย */}
            {phase === "answer" && (p.hintLeft ?? 0) > 0 && eliminated.length === 0 && (
              <button onClick={useHint} className="pixel-btn mt-3 w-full bg-[#00a800] px-3 py-2 text-sm text-white">
                ✂️ ใช้ไอเทมตัด 2 ช้อยส์ (เหลือ {p.hintLeft} ชิ้น)
              </button>
            )}

            {/* ผลลัพธ์ + เฉลยทีละขั้น */}
            <AnimatePresence>
              {phase === "correct" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative mt-4 border-4 border-[#0b0620] bg-green-500 p-3 text-white"
                >
                  <p className="font-pixel text-xs">ถูกต้อง! 🎉 +{p.coinReward ?? 10} เหรียญ</p>
                  <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 0.7 }} className="mt-2 text-3xl">
                    🪙
                  </motion.div>
                  <button onClick={() => finish(true)} className="pixel-btn mt-2 w-full bg-[#fbd000] px-3 py-2 text-sm text-[#0b0620]">
                    ▶ ไปต่อ
                  </button>
                </motion.div>
              )}

              {(phase === "wrong" || phase === "timeout") && (
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative mt-4 space-y-3"
                >
                  <div className="border-4 border-[#0b0620] bg-red-600 p-3 text-white">
                    <p className="font-pixel text-xs">{phase === "timeout" ? "หมดเวลา! ⏰" : "ผิดแล้ว 💔 ดูทริก 💡"}</p>
                    <p className="mt-1 text-sm">
                      คำตอบที่ถูกคือ <b>{["A", "B", "C", "D"][question.answer]}</b> : <MathText>{question.options[question.answer]}</MathText>
                    </p>
                  </div>

                  {/* วิธีทำทีละขั้น (fade-in ทีละบรรทัด) */}
                  <div className="border-4 border-[#0b0620] bg-[#120a26] p-3">
                    <p className="mb-2 font-pixel text-[10px] text-[#fbd000]">✍️ วิธีทำทีละขั้น</p>
                    {question.steps.map((s, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -18 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 + i * 0.45 }}
                        className="mb-2 flex gap-2 border-l-4 pl-2 text-sm"
                        style={{ borderColor: ["#fbd000", "#00e5ff", "#7CFC00", "#ff8a65", "#ba68c8", "#4dd0e1"][i % 6] }}
                      >
                        <span className="font-pixel text-[10px] text-white/60">{i + 1}</span>
                        <span className="text-white/90">
                          <MathText>{s}</MathText>
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="border-4 border-[#0b0620] bg-green-700 p-3 text-sm text-white">
                    💡 <b>ทริกคิดลัด:</b> <MathText>{question.trick}</MathText>
                  </motion.div>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} className="border-4 border-[#0b0620] bg-yellow-400 p-3 text-sm text-[#0b0620]">
                    📏 <b>สูตรที่ใช้:</b> <MathText>{question.formula}</MathText>
                  </motion.div>

                  <div className="flex gap-2">
                    {p.allowRetry && (
                      <button onClick={retry} className="pixel-btn flex-1 bg-[#fbd000] px-3 py-2 text-sm text-[#0b0620]">
                        🔁 ลองตอบใหม่ (หัวใจหายไปแล้ว 1 ดวง)
                      </button>
                    )}
                    <button onClick={() => finish(false)} className="pixel-btn flex-1 bg-[#2a1a4a] px-3 py-2 text-sm text-white">
                      {p.allowRetry ? "➡️ ข้ามข้อนี้" : "▶ ไปต่อ"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
