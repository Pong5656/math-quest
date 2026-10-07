"use client";
// ══════════════════════════════════════════════════════════
// โหมดตะลุยโจทย์ / แบบทดสอบประจำบท (/chapter/[id]/quiz)
// ไล่ระดับ 🟢 ง่าย 🟡 กลาง 🔴 ยาก · วัดความเข้าใจ · ข้อผิดถูกเก็บลงสมุดจดอัตโนมัติ
// ══════════════════════════════════════════════════════════
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { DIFF_META, getChapter } from "@/data";
import type { Difficulty, Question } from "@/lib/types";
import QuizModal from "@/components/QuizModal";
import Confetti from "@/components/Confetti";
import MathText from "@/lib/math";
import { addWrong, loadState, recordResult, saveState } from "@/lib/storage";
import { submitScore, useGameState } from "@/lib/useGameState";
import { sfx } from "@/lib/sound";

type Filter = "all" | Difficulty;

export default function QuizPage() {
  const params = useParams<{ id: string }>();
  const chapter = getChapter(params.id ?? "");
  const { update, state } = useGameState();
  const [filter, setFilter] = useState<Filter>("all");
  const [timed, setTimed] = useState(true);
  const [phase, setPhase] = useState<"setup" | "play" | "result">("setup");
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);
  const [log, setLog] = useState<{ q: Question; ok: boolean }[]>([]);

  const list = useMemo(() => {
    if (!chapter) return [];
    const base = filter === "all" ? chapter.questions : chapter.questions.filter((q) => q.diff === filter);
    const order: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2 };
    return [...base].sort((a, b) => order[a.diff] - order[b.diff]);
  }, [chapter, filter]);

  if (!chapter) {
    return (
      <div className="pixel-box bg-[#1b1140] p-6 text-center">
        <p className="font-pixel text-sm text-red-400">404 — ไม่พบบทเรียนนี้</p>
        <Link href="/select" className="pixel-btn mt-4 inline-block bg-[#fbd000] px-4 py-2 text-sm text-[#0b0620]">◀ กลับ</Link>
      </div>
    );
  }

  const start = () => {
    setLog([]);
    setIdx(0);
    setPhase("play");
    setOpen(true);
    sfx.power();
  };

  const onAnswer = (ok: boolean) => {
    const q = list[idx];
    // เก็บข้อที่ผิดลงสมุดจดข้อผิดอัตโนมัติ (ทบทวนแบบ spaced repetition)
    if (!ok && q) saveState(addWrong(loadState(), q.id, chapter.id));
    setLog((l) => [...l, { q, ok }]);
    setOpen(false);
    if (idx + 1 >= list.length) {
      const correct = log.filter((l) => l.ok).length + (ok ? 1 : 0);
      const wrongN = list.length - correct;
      const score = correct * 20 + (correct === list.length ? 100 : 0);
      const coins = correct * 3;
      update((s) => recordResult(s, chapter.id, { correct, wrong: wrongN, coins, score, win: correct >= Math.ceil(list.length * 0.6), kind: "quiz" }));
      void submitScore({ name: state.name, chapterId: chapter.id, mode: "quiz", score, coins, correct, wrong: wrongN });
      setPhase("result");
      correct >= Math.ceil(list.length * 0.6) ? sfx.fanfare() : sfx.gameover();
    } else {
      setTimeout(() => {
        setIdx((i) => i + 1);
        setOpen(true);
      }, 420);
    }
  };

  const correctCount = log.filter((l) => l.ok).length;

  return (
    <div className="space-y-4">
      <header className="pixel-box p-4" style={{ background: `linear-gradient(135deg, ${chapter.color}44, #1b1140)` }}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-4xl">📝</span>
          <div>
            <p className="font-pixel text-[10px] text-white/60">CHAPTER TEST</p>
            <h1 className="text-xl font-extrabold" style={{ color: chapter.color }}>
              แบบทดสอบประจำบท: {chapter.title}
            </h1>
            <p className="text-xs text-white/70">โจทย์ทั้งหมด {chapter.questions.length} ข้อ · เฉลยทีละขั้นทุกข้อ · ข้อผิดถูกเก็บลงสมุดจด</p>
          </div>
          <Link href={`/chapter/${chapter.id}/mode`} className="pixel-btn ml-auto bg-[#0b0620] px-3 py-2 text-xs text-white">⚙️ โหมด</Link>
        </div>
      </header>

      {/* ตั้งค่าก่อนเริ่ม */}
      {phase === "setup" && (
        <div className="pixel-box bg-[#120a26] p-4">
          <h2 className="mb-2 font-pixel text-[11px] text-[#fbd000]">⚙️ ตั้งค่าแบบทดสอบ</h2>
          <div className="mb-3">
            <p className="mb-1 text-xs text-white/70">เลือกระดับความยาก</p>
            <div className="flex flex-wrap gap-2">
              {(["all", "easy", "medium", "hard"] as Filter[]).map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`pixel-btn px-3 py-2 text-xs ${filter === f ? "bg-[#fbd000] text-[#0b0620]" : "bg-[#2a1a4a] text-white"}`}>
                  {f === "all" ? "🎯 ทั้งหมด" : `${DIFF_META[f].dot} ${DIFF_META[f].label}`}
                </button>
              ))}
            </div>
          </div>
          <label className="mb-3 flex items-center gap-2 text-xs text-white/80">
            <input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} className="h-4 w-4 accent-[#fbd000]" />
            ⏱ จับเวลา 60 วินาทีต่อข้อ (เหมือนสอบจริง)
          </label>
          <div className="mb-3 border-4 border-[#0b0620] bg-white/5 p-3 text-xs text-white/75">
            <p className="mb-1 font-bold text-[#fbd000]">จะทำทั้งหมด {list.length} ข้อ</p>
            <ul className="space-y-0.5">
              {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                <li key={d}>
                  {DIFF_META[d].dot} {DIFF_META[d].label} ({DIFF_META[d].desc}) : {list.filter((q) => q.diff === d).length} ข้อ
                </li>
              ))}
            </ul>
          </div>
          <button onClick={start} disabled={list.length === 0} className="pixel-btn w-full bg-[#00a800] px-4 py-4 text-sm text-white sm:text-base">
            ▶ เริ่มทำแบบทดสอบ
          </button>
        </div>
      )}

      {/* ระหว่างทำข้อสอบ */}
      {phase === "play" && (
        <div className="pixel-box bg-[#120a26] p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="font-pixel text-[10px] text-white/70">
              ข้อ {idx + 1}/{list.length}
            </span>
            <div className="h-3 flex-1 border-2 border-[#0b0620] bg-black/40">
              <motion.div className="h-full bg-[#fbd000]" animate={{ width: `${(idx / list.length) * 100}%` }} />
            </div>
            <span className="text-xs text-green-400">✔ {log.filter((l) => l.ok).length}</span>
            <span className="text-xs text-red-400">✘ {log.filter((l) => !l.ok).length}</span>
          </div>
          <div className="border-4 border-[#0b0620] bg-white/5 p-6 text-center text-sm text-white/80">
            <motion.span animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 1.6 }} className="inline-block text-5xl">
              ✏️
            </motion.span>
            <p className="mt-2">กำลังทำข้อ {idx + 1} … ตั้งใจนะ!</p>
          </div>
        </div>
      )}

      {/* สรุปผล */}
      {phase === "result" && (
        <div className="space-y-3">
          {correctCount === list.length && <Confetti />}
          <div className="pixel-box bg-[#120a26] p-5 text-center">
            <p className="font-pixel text-sm text-[#fbd000]">RESULT</p>
            <p className="mt-2 text-5xl">{correctCount === list.length ? "🏆" : correctCount >= list.length * 0.6 ? "🎉" : "💪"}</p>
            <p className="mt-2 text-lg font-extrabold text-white">
              ทำได้ {correctCount}/{list.length} ข้อ ({Math.round((correctCount / Math.max(1, list.length)) * 100)}%)
            </p>
            <p className="text-xs text-white/70">
              {correctCount === list.length
                ? "สมบูรณ์แบบ! คุณพร้อมสู้บอสท้ายบทแล้ว 👹"
                : correctCount >= list.length * 0.6
                  ? "ดีมาก! ทบทวนข้อที่ผิดในสมุดจดแล้วลองใหม่อีกครั้ง"
                  : "กลับไปอ่านหน้าเรียน (จับมือสอน) อีกสักรอบ แล้วค่อยกลับมาท้านะ!"}
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <button onClick={start} className="pixel-btn bg-[#fbd000] px-4 py-2 text-xs text-[#0b0620]">🔁 ทำใหม่</button>
              <Link href={`/chapter/${chapter.id}/boss`} className="pixel-btn bg-red-700 px-4 py-2 text-xs text-white">👹 สู้บอสท้ายบท</Link>
              <Link href="/notebook" className="pixel-btn bg-[#2a1a4a] px-4 py-2 text-xs text-white">📓 สมุดจดข้อผิด</Link>
              <Link href={`/chapter/${chapter.id}/study`} className="pixel-btn bg-sky-600 px-4 py-2 text-xs text-white">📖 ทบทวนบทเรียน</Link>
            </div>
          </div>

          <div className="pixel-box bg-[#120a26] p-4">
            <h2 className="mb-2 font-pixel text-[11px] text-[#fbd000]">📋 สรุปทีละข้อ</h2>
            <ul className="space-y-2">
              {log.map((l, i) => (
                <li key={i} className={`border-l-4 bg-white/5 p-2 text-xs ${l.ok ? "border-green-500" : "border-red-500"}`}>
                  <p className="mb-1 font-bold text-white">
                    {l.ok ? "✅" : "❌"} ข้อ {i + 1} · {DIFF_META[l.q.diff].dot} {DIFF_META[l.q.diff].label}
                  </p>
                  <p className="text-white/80">
                    <MathText>{l.q.q}</MathText>
                  </p>
                  <p className="mt-1 text-green-300">
                    ตอบ: <MathText>{l.q.options[l.q.answer]}</MathText>
                  </p>
                  {!l.ok && (
                    <div className="mt-1 space-y-1 border-t-2 border-white/10 pt-1 text-white/70">
                      {l.q.steps.map((s, k) => (
                        <p key={k}>
                          <b className="text-[#fbd000]">ขั้น {k + 1}:</b> <MathText>{s}</MathText>
                        </p>
                      ))}
                      <p className="text-green-300">💡 {l.q.trick}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <QuizModal
        question={phase === "play" ? list[idx] : null}
        open={open && phase === "play"}
        title={`แบบทดสอบ · ${chapter.title}`}
        timeLimit={timed ? 60 : 0}
        allowRetry={false}
        coinReward={3}
        onAnswer={onAnswer}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
