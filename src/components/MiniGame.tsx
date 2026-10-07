"use client";

// ===== มินิเกมประจำบท — รองรับ 5 รูปแบบการควบคุม ไม่ซ้ำกันตามโจทย์แต่ละบท =====

import { useState } from "react";
import { motion } from "framer-motion";
import type { MiniControl, MiniGame, MiniRound } from "@/lib/types";
import MathText from "./MathText";
import { PixelButton } from "./ui";
import { addCoins, addScore, awardBadge, bumpStreak, markDone } from "@/lib/store";
import { sfx } from "@/lib/sfx";
import Confetti from "./Confetti";

export default function MiniGameRunner({ game, chId, chapterName }: { game: MiniGame; chId: string; chapterName: string }) {
  const [ri, setRi] = useState(-1); // -1 = หน้าเรื่องราวเปิดเกม
  const [stars, setStars] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [feedback, setFeedback] = useState<null | boolean>(null);
  const [finished, setFinished] = useState(false);

  const start = () => {
    bumpStreak();
    sfx.powerup();
    setRi(0);
    setStars(0);
    setAttempt(0);
    setFeedback(null);
    setFinished(false);
  };

  const submit = (ok: boolean) => {
    setFeedback(ok);
    if (ok) {
      sfx.correct();
      if (attempt === 0) setStars((s) => s + 1);
    } else {
      sfx.wrong();
      setAttempt((a) => a + 1);
    }
  };

  const next = () => {
    sfx.click();
    setFeedback(null);
    setAttempt(0);
    if (ri + 1 >= game.rounds.length) {
      // จบเกม: แจกรางวัล
      const coins = 20 + stars * 10;
      addCoins(coins);
      addScore(stars * 40);
      markDone(chId, "mini");
      awardBadge(`mini:${chId}`);
      sfx.fanfare();
      setFinished(true);
    } else setRi(ri + 1);
  };

  if (finished) {
    return (
      <div className="relative mx-auto max-w-2xl">
        <Confetti />
        <div className="pixel-card bg-[#fff8e7] p-6 text-center">
          <p className="font-pixel text-sm text-green-700">MINI GAME CLEAR! 🎉</p>
          <p className="mt-3 text-xl font-extrabold">{game.emoji} {game.title}</p>
          <p className="mt-2 text-lg font-bold text-amber-700">
            ผ่านครั้งแรก {stars}/{game.rounds.length} ด่าน {"⭐".repeat(Math.max(stars, 1))}
          </p>
          <p className="mt-1 text-sm font-semibold">🪙 +{20 + stars * 10} เหรียญ · ⭐ +{stars * 40} คะแนน</p>
          <p className="mt-1 text-sm text-amber-700">🏅 ได้รับ Badge: "จ้าว{game.title}"</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <PixelButton onClick={start}>🔄 เล่นใหม่</PixelButton>
            <PixelButton color="bg-sky-400" href={`/chapter/${chId}/mode`}>กลับหน้าโหมด</PixelButton>
          </div>
        </div>
      </div>
    );
  }

  if (ri === -1) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="pixel-card bg-[#fff8e7] p-6 text-center">
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="text-6xl">
            {game.emoji}
          </motion.div>
          <p className="mt-3 font-pixel text-xs leading-5 text-amber-700">มินิเกมบท {chapterName}</p>
          <h2 className="mt-2 text-2xl font-extrabold">{game.title}</h2>
          <p className="mt-3 text-sm font-medium leading-6 text-slate-700 sm:text-base">{game.story}</p>
          <PixelButton className="mt-5" onClick={start} color="bg-green-400">▶ เริ่มภารกิจ!</PixelButton>
        </div>
      </div>
    );
  }

  const round = game.rounds[ri];
  return (
    <div className="mx-auto max-w-2xl">
      <div className="pixel-card bg-[#fff8e7] p-4 sm:p-6">
        {/* ความคืบหน้า */}
        <div className="mb-3 flex items-center gap-2">
          <span className="font-pixel text-[10px] text-amber-700">{game.emoji} {game.title}</span>
          <div className="ml-auto flex gap-1">
            {game.rounds.map((_, i) => (
              <span key={i} className={`h-3 w-3 rounded-sm border-2 border-[#23273a] ${i < ri ? "bg-green-500" : i === ri ? "bg-yellow-400" : "bg-slate-200"}`} />
            ))}
          </div>
        </div>

        <h3 className="text-lg font-extrabold text-slate-800">
          🚩 ด่าน {ri + 1}: {round.title}
        </h3>
        <div className="mt-2 rounded-sm border-4 border-slate-300 bg-white p-3 text-sm font-medium sm:text-base">
          <MathText text={round.prompt} />
        </div>

        <div className="mt-4">
          {feedback === null ? (
            <ControlPanel control={round.control} onSubmit={submit} />
          ) : (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`rounded-sm border-4 p-4 ${feedback ? "border-green-700 bg-green-100" : "border-red-600 bg-red-100 shake"}`}
            >
              <p className={`font-pixel text-xs ${feedback ? "text-green-700" : "text-red-600"}`}>
                {feedback ? "สำเร็จ! 🎉 +10 เหรียญ" : "ยังไม่ถูก 💡 ดูคำอธิบายแล้วลองใหม่!"}
              </p>
              <p className="mt-2 text-sm font-medium text-slate-800">
                <MathText text={round.explain} />
              </p>
              <div className="mt-3">
                {feedback ? (
                  <PixelButton onClick={next} color="bg-green-400">{ri + 1 >= game.rounds.length ? "🏁 ดูผลรวม" : "ด่านต่อไป ➜"}</PixelButton>
                ) : (
                  <PixelButton onClick={() => setFeedback(null)}>🔄 ลองใหม่</PixelButton>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

/** แผงควบคุมแต่ละชนิด */
function ControlPanel({ control, onSubmit }: { control: MiniControl; onSubmit: (ok: boolean) => void }) {
  switch (control.type) {
    case "choice":
      return <ChoiceCtl options={control.options} answer={control.answer} onSubmit={onSubmit} />;
    case "multi":
      return <MultiCtl options={control.options} answer={control.answer} note={control.note} onSubmit={onSubmit} />;
    case "toggles":
      return <TogglesCtl labels={control.labels} target={control.target} onSubmit={onSubmit} />;
    case "sliders":
      return <SlidersCtl params={control.params} onSubmit={onSubmit} />;
    case "input":
      return <InputCtl answer={control.answer} tol={control.tol ?? 0.01} unit={control.unit} onSubmit={onSubmit} />;
  }
}

function CheckBtn({ onClick }: { onClick: () => void }) {
  return (
    <PixelButton className="mt-4" onClick={onClick} color="bg-yellow-400">✔ ตรวจคำตอบ</PixelButton>
  );
}

function ChoiceCtl({ options, answer, onSubmit }: { options: string[]; answer: number; onSubmit: (ok: boolean) => void }) {
  const [pick, setPick] = useState<number | null>(null);
  return (
    <div className="space-y-2">
      {options.map((o, i) => (
        <button
          key={i}
          type="button"
          onClick={() => {
            sfx.click();
            setPick(i);
          }}
          className={`w-full rounded-sm border-4 px-3 py-2.5 text-left text-sm font-semibold ${
            pick === i ? "border-amber-600 bg-yellow-200" : "border-[#23273a] bg-sky-100 hover:bg-yellow-100"
          }`}
        >
          <MathText text={o} />
        </button>
      ))}
      <CheckBtn onClick={() => pick !== null && onSubmit(pick === answer)} />
    </div>
  );
}

function MultiCtl({ options, answer, note, onSubmit }: { options: string[]; answer: number[]; note?: string; onSubmit: (ok: boolean) => void }) {
  const [sel, setSel] = useState<Set<number>>(new Set());
  const toggle = (i: number) => {
    sfx.click();
    setSel((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  };
  const ok = sel.size === answer.length && answer.every((a) => sel.has(a));
  return (
    <div>
      {note ? <p className="mb-2 text-xs font-bold text-amber-700">{note}</p> : null}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {options.map((o, i) => (
          <button
            key={i}
            type="button"
            onClick={() => toggle(i)}
            className={`rounded-sm border-4 px-2 py-2 text-center text-sm font-semibold ${
              sel.has(i) ? "border-green-700 bg-green-200" : "border-[#23273a] bg-white hover:bg-yellow-100"
            }`}
          >
            <MathText text={o} />
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-600">เลือกแล้ว {sel.size} ชิ้น</p>
      <CheckBtn onClick={() => onSubmit(ok)} />
    </div>
  );
}

function TogglesCtl({ labels, target, onSubmit }: { labels: string[]; target: boolean[]; onSubmit: (ok: boolean) => void }) {
  const [vals, setVals] = useState<boolean[]>(labels.map(() => false));
  const ok = vals.every((v, i) => v === target[i]);
  return (
    <div className="space-y-2">
      {labels.map((l, i) => (
        <div key={i} className="flex items-center gap-3 rounded-sm border-4 border-[#23273a] bg-white px-3 py-2">
          <span className="flex-1 text-sm font-semibold"><MathText text={l} /></span>
          <button
            type="button"
            onClick={() => {
              sfx.click();
              setVals((v) => v.map((x, j) => (j === i ? !x : x)));
            }}
            className={`w-24 rounded-sm border-4 px-2 py-1 font-pixel text-[10px] ${
              vals[i] ? "border-green-800 bg-green-400 text-green-950" : "border-red-800 bg-red-300 text-red-950"
            }`}
          >
            {vals[i] ? "TRUE" : "FALSE"}
          </button>
        </div>
      ))}
      <CheckBtn onClick={() => onSubmit(ok)} />
    </div>
  );
}

function SlidersCtl({
  params,
  onSubmit,
}: {
  params: { key: string; label: string; min: number; max: number; step: number; target: number }[];
  onSubmit: (ok: boolean) => void;
}) {
  const [vals, setVals] = useState<Record<string, number>>(() => Object.fromEntries(params.map((p) => [p.key, p.min])));
  const ok = params.every((p) => Math.abs(vals[p.key] - p.target) < p.step * 0.51);
  return (
    <div className="space-y-3">
      {params.map((p) => (
        <div key={p.key} className="rounded-sm border-4 border-[#23273a] bg-white p-3">
          <div className="mb-1 flex justify-between text-sm font-bold">
            <span><MathText text={p.label} /></span>
            <span className="font-pixel text-[11px] text-amber-700">{vals[p.key]}</span>
          </div>
          <input
            type="range"
            min={p.min}
            max={p.max}
            step={p.step}
            value={vals[p.key]}
            onChange={(e) => setVals((v) => ({ ...v, [p.key]: Number(e.target.value) }))}
            className="w-full accent-amber-600"
          />
        </div>
      ))}
      <CheckBtn onClick={() => onSubmit(ok)} />
    </div>
  );
}

function InputCtl({ answer, tol, unit, onSubmit }: { answer: number; tol: number; unit?: string; onSubmit: (ok: boolean) => void }) {
  const [v, setV] = useState("");
  const num = Number(v);
  const ok = v.trim() !== "" && !Number.isNaN(num) && Math.abs(num - answer) <= tol;
  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          step="any"
          value={v}
          onChange={(e) => setV(e.target.value)}
          placeholder="พิมพ์คำตอบเป็นตัวเลข"
          className="w-full rounded-sm border-4 border-[#23273a] bg-white px-3 py-2.5 text-lg font-bold focus:outline-none focus:ring-4 focus:ring-yellow-300"
        />
        {unit ? <span className="font-bold">{unit}</span> : null}
      </div>
      <CheckBtn onClick={() => onSubmit(ok)} />
    </div>
  );
}
