"use client";
// ══════════════════════════════════════════════════════════
// โหมดบอสท้ายบท (/chapter/[id]/boss) — เหมือนข้อสอบจริง
//  • โจทย์ระดับ 🔴 ยาก · จับเวลา 45 วินาทีต่อข้อ
//  • ตอบถูก = ตีบอส (Streak ยิ่งยาว โบนัสคะแนนยิ่งมาก) + เหรียญพิเศษ
//  • ตอบผิด = เสียหัวใจ 1 จาก 3 ดวง + เฉลยทีละขั้น
// ══════════════════════════════════════════════════════════
import Link from "next/link";
import { useParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { bossQuestions, getChapter } from "@/data";
import type { Question } from "@/lib/types";
import QuizModal from "@/components/QuizModal";
import Confetti from "@/components/Confetti";
import HeartBar from "@/components/HeartBar";
import { addWrong, loadState, recordResult, saveState } from "@/lib/storage";
import { submitScore, useGameState } from "@/lib/useGameState";
import { sfx } from "@/lib/sound";

const BOSS_MAX_HP = 8;

export default function BossPage() {
  const params = useParams<{ id: string }>();
  const chapter = getChapter(params.id ?? "");
  const { update, state } = useGameState();
  const [phase, setPhase] = useState<"intro" | "fight" | "win" | "lose">("intro");
  const [seed, setSeed] = useState(0);
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);
  const [hp, setHp] = useState(BOSS_MAX_HP);
  const [hearts, setHearts] = useState(3);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [hit, setHit] = useState(false);
  const [log, setLog] = useState<{ q: Question; ok: boolean }[]>([]);

  const questions = useMemo(() => (chapter ? bossQuestions(chapter) : []), [chapter, seed]);

  if (!chapter) {
    return (
      <div className="pixel-box bg-[#1b1140] p-6 text-center">
        <p className="font-pixel text-sm text-red-400">404 — ไม่พบบทเรียนนี้</p>
        <Link href="/select" className="pixel-btn mt-4 inline-block bg-[#fbd000] px-4 py-2 text-sm text-[#0b0620]">◀ กลับ</Link>
      </div>
    );
  }

  const start = () => {
    setPhase("fight");
    setIdx(0);
    setHp(BOSS_MAX_HP);
    setHearts(3);
    setStreak(0);
    setScore(0);
    setCoins(0);
    setLog([]);
    setOpen(true);
    sfx.boss();
  };

  const finish = (win: boolean, finalScore: number, finalCoins: number, correct: number, wrong: number) => {
    update((s) =>
      recordResult(s, chapter.id, {
        correct,
        wrong,
        coins: finalCoins,
        score: finalScore,
        win,
        badgeName: win ? `ผู้ปราบ${chapter.bossName}` : undefined,
        kind: "boss",
      }),
    );
    void submitScore({ name: state.name, chapterId: chapter.id, mode: "boss", score: finalScore, coins: finalCoins, correct, wrong });
    setPhase(win ? "win" : "lose");
    win ? sfx.fanfare() : sfx.gameover();
  };

  const onAnswer = (ok: boolean, firstTry: boolean) => {
    const q = questions[idx];
    if (!ok && q) saveState(addWrong(loadState(), q.id, chapter.id));
    setLog((l) => [...l, { q, ok }]);
    setOpen(false);

    const correct = log.filter((l) => l.ok).length + (ok ? 1 : 0);
    const wrongN = log.length + 1 - correct;

    if (ok) {
      setHit(true);
      setTimeout(() => setHit(false), 450);
      sfx.stomp();
      const newStreak = streak + 1;
      const bonus = 1 + Math.min(newStreak - 1, 4) * 0.25; // Streak โบนัสสูงสุด ×2
      const gain = Math.round(150 * bonus * (firstTry ? 1 : 0.7));
      const special = 50 + (newStreak >= 3 ? 25 : 0); // เหรียญพิเศษ
      const newHp = Math.max(0, hp - 1);
      const newScore = score + gain;
      const newCoins = coins + special;
      setStreak(newStreak);
      setScore(newScore);
      setCoins(newCoins);
      setHp(newHp);
      sfx.coin();
      if (newHp <= 0 || idx + 1 >= questions.length) {
        finish(newHp <= 0, newScore + (newHp <= 0 ? 500 : 0), newCoins, correct, wrongN);
        return;
      }
    } else {
      const newHearts = hearts - 1;
      setHearts(newHearts);
      setStreak(0);
      sfx.wrong();
      if (newHearts <= 0) {
        finish(false, score, coins, correct, wrongN);
        return;
      }
    }
    setTimeout(() => {
      setIdx((i) => i + 1);
      setOpen(true);
    }, 500);
  };

  return (
    <div className="space-y-4">
      <header className="pixel-box bg-gradient-to-r from-red-900 to-[#1b1140] p-4">
        <div className="flex flex-wrap items-center gap-3">
          <motion.span animate={{ scale: [1, 1.15, 1], rotate: [0, 6, -6, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="text-5xl">
            👹
          </motion.span>
          <div>
            <p className="font-pixel text-[10px] text-red-300">FINAL BOSS</p>
            <h1 className="text-xl font-extrabold text-red-400">{chapter.bossName}</h1>
            <p className="text-xs text-white/75">บท {chapter.title} · ม.{chapter.level.replace("m", "")} เล่ม {chapter.book}</p>
          </div>
          <Link href={`/chapter/${chapter.id}/mode`} className="pixel-btn ml-auto bg-[#0b0620] px-3 py-2 text-xs text-white">⚙️ โหมด</Link>
        </div>
      </header>

      {phase === "intro" && (
        <div className="pixel-box bg-[#120a26] p-5 text-center">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-lg text-sm leading-relaxed text-white/85">
            🗣️ {chapter.bossIntro}
          </motion.p>
          <div className="mx-auto mt-4 grid max-w-lg gap-2 text-left text-xs text-white/75">
            <p className="border-l-4 border-red-500 bg-red-900/20 px-2 py-1">⏱ จับเวลา 45 วินาทีต่อข้อ (เหมือนนั่งสอบจริง)</p>
            <p className="border-l-4 border-[#fbd000] bg-yellow-900/20 px-2 py-1">🔥 Streak โบนัส: ตอบถูกต่อเนื่อง คะแนนเพิ่มสูงสุด ×2</p>
            <p className="border-l-4 border-green-500 bg-green-900/20 px-2 py-1">🪙 เหรียญพิเศษข้อละ 50 (+25 ถ้า Streak ≥ 3)</p>
            <p className="border-l-4 border-sky-500 bg-sky-900/20 px-2 py-1">❤️ หัวใจ 3 ดวง — ตอบผิดหรือหมดเวลา เสีย 1 ดวง</p>
            <p className="border-l-4 border-fuchsia-500 bg-fuchsia-900/20 px-2 py-1">🏅 ชนะบอสรับ Badge “ผู้ปราบ{chapter.bossName}”</p>
          </div>
          <button onClick={start} className="pixel-btn blink mt-5 bg-red-700 px-8 py-4 text-sm text-white sm:text-base">
            ⚔️ เริ่มการต่อสู้
          </button>
          <Link href={`/chapter/${chapter.id}/study`} className="pixel-btn mt-2 block bg-[#2a1a4a] px-4 py-2 text-xs text-white">
            📖 ยังไม่พร้อม — กลับไปทบทวนก่อน
          </Link>
        </div>
      )}

      {(phase === "fight" || phase === "win" || phase === "lose") && (
        <div className="pixel-box relative overflow-hidden bg-[#120a26] p-4">
          {/* ฉากต่อสู้ */}
          <div className="relative mb-3 flex h-52 items-end justify-between overflow-hidden border-4 border-[#0b0620] bg-gradient-to-b from-red-950 via-[#2a1a4a] to-[#0b0620] p-3">
            <div className="absolute inset-x-0 bottom-0 h-8 bg-[#c84c0c]" style={{ borderTop: "4px solid #0b0620" }} />

            {/* ผู้เล่น */}
            <motion.div animate={{ y: phase === "fight" ? [0, -4, 0] : 0 }} transition={{ repeat: Infinity, duration: 1.2 }} className="relative z-10 text-5xl">
              🧑‍🎓
              <p className="mt-1 text-center font-pixel text-[8px] text-white">YOU</p>
            </motion.div>

            {/* บอส */}
            <motion.div
              animate={hit ? { x: [0, -14, 12, -8, 0], filter: ["none", "brightness(3)", "none"] } : { y: [0, -10, 0] }}
              transition={hit ? { duration: 0.45 } : { repeat: Infinity, duration: 2.4 }}
              className={`relative z-10 text-7xl ${phase === "lose" ? "" : ""} ${hp <= 0 ? "opacity-30 grayscale" : ""}`}
            >
              👹
              <p className="mt-1 text-center font-pixel text-[8px] text-red-300">BOSS</p>
            </motion.div>

            {/* เอฟเฟกต์ตี */}
            <AnimatePresence>
              {hit && (
                <motion.span initial={{ scale: 0, opacity: 1 }} animate={{ scale: 2.4, opacity: 0 }} exit={{ opacity: 0 }} className="absolute right-16 bottom-16 z-20 text-4xl">
                  💥
                </motion.span>
              )}
            </AnimatePresence>

            {/* Streak */}
            {streak >= 2 && (
              <span className="pixel-btn absolute left-2 top-2 bg-[#fbd000] px-2 py-1 font-pixel text-[9px] text-[#0b0620]">
                🔥 STREAK ×{streak} (คะแนน ×{(1 + Math.min(streak - 1, 4) * 0.25).toFixed(2)})
              </span>
            )}
          </div>

          {/* แถบพลัง */}
          <div className="mb-2">
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <span className="font-pixel text-red-300">BOSS HP</span>
              <span className="text-white/70">
                {hp}/{BOSS_MAX_HP}
              </span>
            </div>
            <div className="h-4 w-full border-2 border-[#0b0620] bg-black/50">
              <motion.div
                className="h-full bg-gradient-to-r from-red-600 to-orange-400"
                animate={{ width: `${(hp / BOSS_MAX_HP) * 100}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 16 }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-4 border-[#0b0620] bg-[#1b1140] p-2">
            <HeartBar hearts={hearts} max={3} />
            <span className="pixel-box bg-[#2a1a4a] px-2 py-1 text-xs text-[#fbd000]">🪙 พิเศษ {coins}</span>
            <span className="pixel-box bg-[#2a1a4a] px-2 py-1 text-xs text-[#7CFC00]">⭐ {score}</span>
            <span className="pixel-box ml-auto bg-[#2a1a4a] px-2 py-1 text-xs text-white/75">
              ข้อ {Math.min(idx + 1, questions.length)}/{questions.length}
            </span>
          </div>

          {phase === "fight" && (
            <div className="mt-3 border-4 border-[#0b0620] bg-white/5 p-6 text-center text-sm text-white/80">
              <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="inline-block text-4xl">⚔️</motion.span>
              <p className="mt-2">บอสกำลังปล่อยโจทย์! ตอบให้ทันภายใน 45 วินาที</p>
            </div>
          )}

          {phase === "win" && (
            <>
              <Confetti />
              <div className="mt-3 border-4 border-[#0b0620] bg-green-700 p-5 text-center">
                <p className="font-pixel text-sm text-[#fbd000]">BOSS DEFEATED!</p>
                <p className="mt-2 text-3xl">🏆</p>
                <p className="mt-2 text-sm text-white">
                  คุณปราบ <b>{chapter.bossName}</b> สำเร็จ! คะแนน {score} · เหรียญพิเศษ {coins} · ตอบถูก {log.filter((l) => l.ok).length}/{questions.length}
                </p>
                <p className="mt-1 text-xs text-white/85">🏅 ได้รับ Badge: ผู้ปราบ{chapter.bossName}</p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <button onClick={() => { setSeed((s) => s + 1); start(); }} className="pixel-btn bg-[#fbd000] px-4 py-2 text-xs text-[#0b0620]">⚔️ สู้ใหม่ (โจทย์ชุดใหม่)</button>
                  <Link href="/stats" className="pixel-btn bg-[#2a1a4a] px-4 py-2 text-xs text-white">🏆 ดูสถิติ</Link>
                  <Link href="/select" className="pixel-btn bg-sky-600 px-4 py-2 text-xs text-white">🎓 ไปบทถัดไป</Link>
                </div>
              </div>
            </>
          )}

          {phase === "lose" && (
            <div className="mt-3 border-4 border-[#0b0620] bg-red-800 p-5 text-center">
              <p className="font-pixel blink text-sm text-white">YOU DIED</p>
              <p className="mt-2 text-3xl">💀</p>
              <p className="mt-2 text-sm text-white/90">หัวใจหมด! บอสยังแข็งแรงอยู่ — ทบทวนเฉลยในสมุดจดข้อผิดแล้วกลับมาสู้ใหม่</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <button onClick={() => { setSeed((s) => s + 1); start(); }} className="pixel-btn bg-[#fbd000] px-4 py-2 text-xs text-[#0b0620]">🔁 สู้ใหม่</button>
                <Link href={`/chapter/${chapter.id}/study`} className="pixel-btn bg-sky-600 px-4 py-2 text-xs text-white">📖 ทบทวนบทเรียน</Link>
                <Link href="/notebook" className="pixel-btn bg-[#2a1a4a] px-4 py-2 text-xs text-white">📓 สมุดจดข้อผิด</Link>
              </div>
            </div>
          )}
        </div>
      )}

      <QuizModal
        question={phase === "fight" ? questions[Math.min(idx, questions.length - 1)] : null}
        open={open && phase === "fight"}
        title={`BOSS · ${chapter.bossName}`}
        timeLimit={45}
        allowRetry={false}
        coinReward={50}
        onAnswer={onAnswer}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
