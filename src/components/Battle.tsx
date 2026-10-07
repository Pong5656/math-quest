"use client";

// ===== โหมดตะลุยโจทย์ (QuizRunner) และโหมดบอส (BossBattle) =====

import { useMemo, useRef, useState } from "react";
import type { Chapter, Diff, Question } from "@/lib/types";
import QuizModal from "./QuizModal";
import Confetti from "./Confetti";
import { PixelButton } from "./ui";
import { addCoins, addScore, awardBadge, bumpStreak, markDone, recordAnswer, setQuizBest } from "@/lib/store";
import { sfx } from "@/lib/sfx";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 🎯 โหมดตะลุยโจทย์ — เลือกกระดับความยาก แล้วลุยเรียงข้อ */
export function QuizRunner({ chapter, level }: { chapter: Chapter; level: Diff | 0 }) {
  const qs = useMemo(() => {
    const pool = level === 0 ? chapter.questions : chapter.questions.filter((q) => q.lv === level);
    return shuffle(pool).slice(0, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapter.id, level]);
  const [i, setI] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const wrongFirst = useRef(false); // ข้อนี้ถูกนับว่าผิดไปแล้ว (ตอนกด "ไปต่อ" จะได้ไม่นับถูกซ้ำ)

  if (qs.length === 0) {
    return <p className="text-center font-bold">ยังไม่มีโจทย์ในระดับนี้</p>;
  }

  if (done) {
    const coins = correct * 5;
    return (
      <div className="mx-auto max-w-xl">
        {correct >= 7 ? <Confetti /> : null}
        <div className="pixel-card bg-[#fff8e7] p-6 text-center">
          <p className="font-pixel text-sm text-amber-700">ผลตะลุยโจทย์ {chapter.emoji} {chapter.short}</p>
          <p className="mt-3 text-3xl font-extrabold">{correct}/{qs.length} ข้อ</p>
          <p className="mt-2 text-sm font-semibold">
            🪙 +{coins} เหรียญ · ⭐ +{correct * 30} คะแนน {correct >= 7 ? "· 🏅 สุดยอดไปเลย!" : ""}
          </p>
          <p className="mt-1 text-xs text-slate-600">ข้อที่ผิดถูกเก็บเข้าสมุดข้อผิดอัตโนมัติ ไปทบทวนได้เลย</p>
        </div>
      </div>
    );
  }

  const q = qs[i];
  const advance = () => {
    wrongFirst.current = false;
    if (i + 1 >= qs.length) {
      setQuizBest(chapter.id, correct * 30);
      addCoins(correct * 5);
      addScore(correct * 30);
      if (correct === qs.length) awardBadge(`quiz:${chapter.id}`);
      setDone(true);
    } else setI(i + 1);
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-2 flex items-center justify-between text-sm font-bold text-white">
        <span className="rounded-sm bg-[#23273a] px-3 py-1">ข้อ {i + 1}/{qs.length}</span>
        <span className="rounded-sm bg-green-700 px-3 py-1">✅ ถูก {correct}</span>
      </div>
      <QuizModal
        key={q.id}
        q={q}
        coinReward={5}
        allowRetry={false}
        onCorrect={() => {
          if (!wrongFirst.current) {
            setCorrect((c) => c + 1);
            recordAnswer(chapter.id, q.id, true);
          }
          advance();
        }}
        onWrong={() => {
          wrongFirst.current = true;
          recordAnswer(chapter.id, q.id, false);
        }}
      />
    </div>
  );
}

/** 🐲 โหมดบอส — โจทย์ยาก จับเวลา 45 วิ ต่อข้อ ชนะบอสเพื่อรับเหรียญพิเศษ */
export function BossBattle({ chapter }: { chapter: Chapter }) {
  const pool = useMemo(() => {
    const hard = shuffle(chapter.questions.filter((q) => q.lv === 3));
    const mid = shuffle(chapter.questions.filter((q) => q.lv === 2));
    return [...hard, ...mid].slice(0, 5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapter.id]);
  const [i, setI] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [bossHp, setBossHp] = useState(5);
  const [phase, setPhase] = useState<"fight" | "win" | "lose">("fight");
  const wrongFirst = useRef(false);

  const boss = chapter.questions.length > 0 ? Math.min(3, Math.floor(bossHp / 2)) : 0; // ท่าทางบอสตามพลังที่เหลือ
  const bossFaces = ["😈", "👹", "🐲"];

  const restart = () => {
    setI(0);
    setHearts(3);
    setBossHp(5);
    setPhase("fight");
    wrongFirst.current = false;
    bumpStreak();
  };

  if (phase === "win") {
    return (
      <div className="mx-auto max-w-xl">
        <Confetti />
        <div className="pixel-card bg-[#fff8e7] p-6 text-center">
          <p className="font-pixel text-base text-green-700">BOSS DEFEATED! ⚔️</p>
          <p className="mt-3 text-4xl">🐲💥</p>
          <p className="mt-2 text-lg font-extrabold">ปราบบอส{chapter.short}สำเร็จ!</p>
          <p className="mt-2 text-sm font-semibold">🪙 +50 เหรียญโบนัส (สะสมระหว่างสู้ +75) · ⭐ +500 คะแนน</p>
          <p className="text-sm text-amber-700 font-bold">🏅 ได้รับ Badge: "ผู้ปราบบอส{chapter.short}"</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <PixelButton onClick={restart}>🔄 สู้ใหม่</PixelButton>
            <PixelButton color="bg-sky-400" href={`/chapter/${chapter.id}/mode`}>กลับหน้าโหมด</PixelButton>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "lose") {
    return (
      <div className="mx-auto max-w-xl">
        <div className="pixel-card bg-[#1a1c26] p-6 text-center text-white">
          <p className="font-pixel text-base text-red-400">พ่ายแพ้ให้บอส... 💀</p>
          <p className="mt-3 text-sm">บอสแข็งแกร่งมาก! ลองทบทวนสูตรในคลังสูตรหรืออ่านเฉลยให้ขึ้นใจ แล้วกลับมาแก้มือนะ</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <PixelButton onClick={restart}>🔄 แก้มือ</PixelButton>
            <PixelButton color="bg-yellow-400" href="/formulas">📜 เปิดคลังสูตร</PixelButton>
          </div>
        </div>
      </div>
    );
  }

  const q: Question = pool[i];
  return (
    <div className="mx-auto max-w-xl">
      {/* สนามรบ */}
      <div className="mb-2 grid grid-cols-2 gap-2">
        <div className="rounded-sm border-4 border-[#23273a] bg-[#23273a] p-2 text-white">
          <p className="font-pixel text-[9px] text-yellow-300">บอส {bossFaces[boss]}</p>
          <div className="mt-1 h-3 rounded-sm border-2 border-white/40 bg-slate-700">
            <div className="timebar h-full bg-red-500" style={{ width: `${(bossHp / pool.length) * 100}%` }} />
          </div>
          <p className="mt-1 text-[10px]">HP {bossHp}/{pool.length}</p>
        </div>
        <div className="rounded-sm border-4 border-[#23273a] bg-[#23273a] p-2 text-white">
          <p className="font-pixel text-[9px] text-green-300">ฮีโร่ 🦸</p>
          <div className="mt-1 flex gap-1 text-lg">
            {Array.from({ length: 3 }, (_, k) => (
              <span key={k} className={k < hearts ? "" : "opacity-20 grayscale"}>❤️</span>
            ))}
          </div>
          <p className="mt-1 text-[10px]">ข้อ {i + 1}/{pool.length} · ⏱ 45 วิ/ข้อ</p>
        </div>
      </div>
      <QuizModal
        key={q.id}
        q={q}
        coinReward={15}
        timerSec={45}
        allowRetry={false}
        onCorrect={() => {
          if (!wrongFirst.current) {
            recordAnswer(chapter.id, q.id, true);
            addCoins(15);
            addScore(100);
            setBossHp((h) => h - 1);
            sfx.hit();
            if (bossHp - 1 <= 0) {
              markDone(chapter.id, "boss");
              awardBadge(`boss:${chapter.id}`);
              addCoins(50);
              addScore(500);
              sfx.fanfare();
              setPhase("win");
              return;
            }
          }
          wrongFirst.current = false;
          setI((x) => x + 1);
        }}
        onWrong={() => {
          wrongFirst.current = true;
          recordAnswer(chapter.id, q.id, false);
          setHearts((h) => {
            const nh = h - 1;
            if (nh <= 0) setTimeout(() => setPhase("lose"), 400);
            return nh;
          });
        }}
      />
    </div>
  );
}
