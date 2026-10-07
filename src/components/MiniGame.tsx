"use client";
// ══════════════════════════════════════════════════════════
// MiniGame — ตัวเลือกว่าบทนี้ใช้มินิเกมตัวไหน (18 แบบ ไม่ซ้ำกันตามคำสั่ง)
// ══════════════════════════════════════════════════════════
import type { Chapter } from "@/lib/types";
import RoundsGame, { type Theme } from "./minigames/RoundsGame";
import { LogicCircuitGame, SetBagGame, WaveDJGame } from "./minigames/SpecialGames";
import type { MiniGameResult } from "./minigames/MiniGameFrame";

/** ธีมฉากของแต่ละมินิเกม */
const THEMES: Record<string, Theme> = {
  "interval-runner": { stage: "🏃", bg: "from-sky-400 to-sky-700", hint: "สะพานจะปรากฏเฉพาะช่วงคำตอบที่ถูก" },
  "composite-factory": { stage: "🏭", bg: "from-lime-400 to-emerald-700", hint: "สายพานโรงงานยา: เรียงเครื่องจักรให้ถูก" },
  "outbreak-log": { stage: "🧟", bg: "from-pink-500 to-purple-800", hint: "เมืองกำลังระบาด ฉีดเซรั่มให้ทันรุ่น" },
  "conic-tower": { stage: "🗼", bg: "from-cyan-400 to-blue-800", hint: "วางป้อมภาคตัดกรวยตั้งรับศัตรู" },
  "matrix-mecha": { stage: "🦾", bg: "from-violet-500 to-indigo-900", hint: "หุ่นยักษ์รอคำสั่งจากเมทริกซ์" },
  "vector-nav": { stage: "🛸", bg: "from-indigo-600 to-black", hint: "อวกาศ 3 มิติ หลบอุกกาบาตด้วยเวกเตอร์" },
  "complex-arcana": { stage: "🪄", bg: "from-fuchsia-600 to-purple-900", hint: "มิติเชิงซ้อน: แปลงเวทเป็นรูปขั้ว" },
  mastermind: { stage: "💻", bg: "from-emerald-500 to-slate-900", hint: "เจาะระบบด้วยการนับจำนวนรหัส" },
  "dice-destiny": { stage: "🎲", bg: "from-amber-500 to-red-900", hint: "บอร์ดเกมแห่งโชคชะตา คิดก่อนเดินหมาก" },
  "idle-tycoon": { stage: "🏦", bg: "from-green-500 to-emerald-900", hint: "อาณาจักรลงทุน: ให้เงินทำงานแทนเรา" },
  "calculus-coaster": { stage: "🎢", bg: "from-rose-500 to-red-900", hint: "ออกแบบรางรถไฟเหาะด้วยอนุพันธ์" },
  "fact-check": { stage: "🕵️‍♀️", bg: "from-stone-500 to-stone-900", hint: "สำนักงานนักสืบข้อมูล จับผิดข่าวปลอม" },
  "idol-agency": { stage: "🎤", bg: "from-pink-500 to-fuchsia-900", hint: "ห้องประชุมค่ายเพลง เสนอกราฟให้บอร์ด" },
  moneyball: { stage: "⚽", bg: "from-blue-500 to-indigo-900", hint: "ห้องวิเคราะห์นักเตะ ตั้งค่าตัวให้คุ้ม" },
  "reactor-z": { stage: "☢️", bg: "from-yellow-500 to-orange-800", hint: "ห้องควบคุมเตาปฏิกรณ์ ระบายความร้อน!" },
};

export default function MiniGame(props: {
  chapter: Chapter;
  onFinish: (r: MiniGameResult) => void;
  onRestart: () => void;
  onExit: () => void;
  onNext?: () => void;
}) {
  const kind = props.chapter.miniGame.kind;
  if (kind === "set-bag") return <SetBagGame {...props} />;
  if (kind === "logic-circuit") return <LogicCircuitGame {...props} />;
  if (kind === "soundwave-dj") return <WaveDJGame {...props} />;
  return <RoundsGame {...props} theme={THEMES[kind] ?? THEMES["interval-runner"]} />;
}
