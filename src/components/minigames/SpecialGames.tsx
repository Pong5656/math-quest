"use client";
// ══════════════════════════════════════════════════════════
// SpecialGames — มินิเกมที่มีกลไกเฉพาะตัว (ไม่ซ้ำกัน)
//  1) SetBagGame      🕵️ จัดกระเป๋าสายลับ (เลือกไอเทมตามเงื่อนไขเซต)
//  2) LogicCircuitGame 💣 ถอดรหัสวงจรระเบิด (สับสวิตช์ T/F)
//  3) WaveDJGame       🎛️ Soundwave DJ (ปรับแอมพลิจูด/คาบให้ตรงคลื่นเป้าหมาย)
// ══════════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Chapter } from "@/lib/types";
import { generateSetRounds, generateLogicRounds, generateWaveRounds } from "@/lib/minigameData";
import MathText from "@/lib/math";
import { sfx } from "@/lib/sound";
import MiniGameFrame, { type MiniGameResult } from "./MiniGameFrame";

interface CommonProps {
  chapter: Chapter;
  onFinish: (r: MiniGameResult) => void;
  onRestart: () => void;
  onExit: () => void;
  onNext?: () => void;
}

/** ฮุกจัดการสถานะกลางของมินิเกม (ชีวิต/คะแนน/รอบ/สรุปผล) */
function useMgState(total: number, onFinish: CommonProps["onFinish"]) {
  const [idx, setIdx] = useState(0);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [result, setResult] = useState<MiniGameResult | null>(null);

  useEffect(() => {
    if ((idx >= total || lives <= 0) && !result) {
      const win = lives > 0 && idx >= total;
      const res = { win, correct, wrong, score: score + (win ? 100 : 0), coins: coins + (win ? 25 : 0) };
      setResult(res);
      onFinish(res);
      win ? sfx.fanfare() : sfx.gameover();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, lives, total]);

  const judge = (ok: boolean) => {
    if (ok) {
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
  const next = () => setIdx((v) => v + 1);
  const reset = () => {
    setIdx(0);
    setLives(3);
    setScore(0);
    setCoins(0);
    setCorrect(0);
    setWrong(0);
    setResult(null);
  };
  return { idx, lives, score, coins, result, judge, next, reset };
}

/* ─────────── 1) 🕵️ จัดกระเป๋าสายลับ ─────────── */
export function SetBagGame(p: CommonProps) {
  const [seed, setSeed] = useState(0);
  const rounds = useMemo(() => generateSetRounds(5), [seed]);
  const st = useMgState(rounds.length, p.onFinish);
  const round = rounds[Math.min(st.idx, rounds.length - 1)];
  const [chosen, setChosen] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  const toggle = (i: number) => {
    if (done) return;
    setChosen((c) => (c.includes(i) ? c.filter((x) => x !== i) : [...c, i]));
    sfx.bump();
  };
  const submit = () => {
    const ok = chosen.length === round.correct.length && round.correct.every((c) => chosen.includes(c));
    st.judge(ok);
    setDone(true);
  };
  const goNext = () => {
    setChosen([]);
    setDone(false);
    st.next();
  };

  return (
    <MiniGameFrame emoji="🕵️" title={p.chapter.miniGame.title} desc={p.chapter.miniGame.desc} round={st.idx} total={rounds.length} lives={st.lives} score={st.score} coins={st.coins} result={st.result} onRestart={() => { st.reset(); setSeed((s) => s + 1); setChosen([]); setDone(false); p.onRestart(); }} onExit={p.onExit} onNext={p.onNext}>
      <div className="mb-3 border-4 border-[#0b0620] bg-yellow-300 p-3 text-center text-[#1a1030]">
        <p className="text-xs font-bold">ประตูเซฟเฮาส์ต้องการเซต:</p>
        <p className="font-pixel text-sm sm:text-base">{round.expr}</p>
      </div>
      <p className="mb-2 text-xs text-white/70">{round.prompt} — เลือกไอเทมทุกชิ้นที่ "เป็นสมาชิก" ของเซตนี้</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {round.items.map((it, i) => {
          const on = chosen.includes(i);
          const right = done && round.correct.includes(i);
          const miss = done && on && !round.correct.includes(i);
          return (
            <button key={i} onClick={() => toggle(i)} className={`pixel-btn flex flex-col items-center gap-1 px-2 py-3 text-xs ${right ? "bg-green-600 text-white" : miss ? "bg-red-600 text-white" : on ? "bg-[#fbd000] text-[#0b0620]" : "bg-[#2a1a4a] text-white"}`}>
              <span className="text-3xl">{it.icon}</span>
              <span className="font-bold">{it.name}</span>
              <span className="text-[10px] opacity-75">{it.tags.join(" · ")}</span>
            </button>
          );
        })}
      </div>
      {!done ? (
        <button onClick={submit} className="pixel-btn mt-3 w-full bg-[#00a800] px-3 py-3 text-sm text-white">🔓 ปลดล็อกประตู</button>
      ) : (
        <div className="mt-3 border-4 border-[#0b0620] bg-[#1b1140] p-3 text-sm text-white">
          <p className="font-pixel text-[10px] text-[#fbd000]">{chosen.length === round.correct.length && round.correct.every((c) => chosen.includes(c)) ? "ประตูเปิด! ✅" : "สัญญาณเตือนดัง! 🚨"}</p>
          <p className="mt-1 text-white/85">{round.explain}</p>
          <button onClick={goNext} className="pixel-btn mt-2 w-full bg-[#fbd000] px-3 py-2 text-xs text-[#0b0620]">▶ ภารกิจถัดไป</button>
        </div>
      )}
    </MiniGameFrame>
  );
}

/* ─────────── 2) 💣 ถอดรหัสวงจรระเบิด ─────────── */
export function LogicCircuitGame(p: CommonProps) {
  const [seed, setSeed] = useState(0);
  const rounds = useMemo(() => generateLogicRounds(5), [seed]);
  const st = useMgState(rounds.length, p.onFinish);
  const round = rounds[Math.min(st.idx, rounds.length - 1)];
  const [vals, setVals] = useState<boolean[]>([true, true, true]);
  const [done, setDone] = useState(false);
  const [countdown, setCountdown] = useState(25);

  // ระเบิดนับถอยหลัง — เพิ่มความกดดันแบบเกมจริง
  useEffect(() => {
    if (done) return;
    setCountdown(25);
    const t = setInterval(() => setCountdown((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, [st.idx, done, seed]);

  useEffect(() => {
    if (countdown === 0 && !done) {
      setDone(true);
      st.judge(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  const cut = () => {
    const ok = round.check(vals) === round.target;
    st.judge(ok);
    setDone(true);
    ok ? sfx.power() : sfx.wrong();
  };
  const goNext = () => {
    setDone(false);
    setVals([true, true, true]);
    st.next();
  };

  return (
    <MiniGameFrame emoji="💣" title={p.chapter.miniGame.title} desc={p.chapter.miniGame.desc} round={st.idx} total={rounds.length} lives={st.lives} score={st.score} coins={st.coins} result={st.result} onRestart={() => { st.reset(); setSeed((s) => s + 1); setDone(false); p.onRestart(); }} onExit={p.onExit} onNext={p.onNext}>
      <div className="mb-3 flex items-center justify-center gap-3 border-4 border-[#0b0620] bg-[#2a1a4a] p-3">
        <motion.span animate={{ scale: countdown < 8 ? [1, 1.25, 1] : 1 }} transition={{ repeat: Infinity, duration: 0.6 }} className="text-4xl">💣</motion.span>
        <div className="text-center">
          <p className="text-xs text-white/70">เหลือเวลาตัดสายไฟ</p>
          <p className={`font-pixel text-lg ${countdown < 8 ? "blink text-red-400" : "text-[#fbd000]"}`}>{countdown}</p>
        </div>
      </div>
      <div className="mb-3 border-4 border-[#0b0620] bg-white p-3 text-center text-[15px] text-[#1a1030]">
        <MathText>{`\\(${round.expr.replace(/∧/g, "\\wedge ").replace(/∨/g, "\\vee ").replace(/~/g, "\\sim ")}\\)`}</MathText>
      </div>
      <p className="mb-2 text-center text-sm text-white/85">{round.prompt}</p>
      <div className="mb-3 grid grid-cols-3 gap-2">
        {["p", "q", "r"].map((v, i) => (
          <button key={v} onClick={() => !done && setVals((s) => s.map((x, j) => (j === i ? !x : x)))} className={`pixel-btn py-4 text-sm font-bold ${vals[i] ? "bg-[#00a800] text-white" : "bg-red-700 text-white"}`}>
            <span className="font-pixel text-[10px]">{v}</span>
            <br />
            {vals[i] ? "T (จริง)" : "F (เท็จ)"}
          </button>
        ))}
      </div>
      <div className="mb-3 text-center text-xs text-white/70">
        ค่าความจริงปัจจุบันของวงจร: <b className={round.check(vals) ? "text-green-400" : "text-red-400"}>{round.check(vals) ? "T" : "F"}</b> (เป้าหมาย: {round.target ? "T" : "F"})
      </div>
      {!done ? (
        <button onClick={cut} className="pixel-btn w-full bg-[#fbd000] px-3 py-3 text-sm text-[#0b0620]">✂️ ตัดสายไฟ!</button>
      ) : (
        <div className="border-4 border-[#0b0620] bg-[#1b1140] p-3 text-sm text-white">
          <p className="font-pixel text-[10px] text-[#fbd000]">{round.check(vals) === round.target ? "ระเบิดถูกปลด! ✅" : "ตูม! 💥 เสียชีวิต 1 ดวง"}</p>
          <p className="mt-1 text-white/85">{round.explain}</p>
          <button onClick={goNext} className="pixel-btn mt-2 w-full bg-[#fbd000] px-3 py-2 text-xs text-[#0b0620]">▶ ลูกลูกถัดไป</button>
        </div>
      )}
    </MiniGameFrame>
  );
}

/* ─────────── 3) 🎛️ Soundwave DJ ─────────── */
export function WaveDJGame(p: CommonProps) {
  const [seed, setSeed] = useState(0);
  const rounds = useMemo(() => generateWaveRounds(4), [seed]);
  const st = useMgState(rounds.length, p.onFinish);
  const round = rounds[Math.min(st.idx, rounds.length - 1)];
  const [A, setA] = useState(1);
  const [B, setB] = useState(1);
  const [done, setDone] = useState(false);
  const cvRef = useRef<HTMLCanvasElement | null>(null);

  // วาดกราฟคลื่นเป้าหมาย (เส้นทอง) กับคลื่นของเรา (เส้นฟ้า) เทียบกันสด ๆ
  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const g = cv.getContext("2d");
    if (!g) return;
    const W = cv.width, H = cv.height;
    g.clearRect(0, 0, W, H);
    g.fillStyle = "#120a26";
    g.fillRect(0, 0, W, H);
    g.strokeStyle = "#ffffff22";
    g.lineWidth = 1;
    for (let x = 0; x < W; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    for (let y = 0; y < H; y += 24) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    g.strokeStyle = "#ffffff66";
    g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke();
    const plot = (amp: number, freq: number, color: string, wdt: number) => {
      g.strokeStyle = color;
      g.lineWidth = wdt;
      g.beginPath();
      for (let px = 0; px <= W; px++) {
        const x = (px / W) * 4 * Math.PI;
        const y = H / 2 - amp * (H / 2 - 12) * Math.sin(freq * x) / 4;
        px === 0 ? g.moveTo(px, y) : g.lineTo(px, y);
      }
      g.stroke();
    };
    plot(round.targetA, round.targetB, "#fbd000", 3);
    plot(A, B, "#00e5ff", 2);
  }, [A, B, round, st.idx, seed]);

  const match = A === round.targetA && B === round.targetB;
  const drop = () => {
    st.judge(match);
    setDone(true);
    match ? sfx.power() : sfx.wrong();
  };
  const goNext = () => {
    setDone(false);
    setA(1);
    setB(1);
    st.next();
  };

  return (
    <MiniGameFrame emoji="🎛️" title={p.chapter.miniGame.title} desc={p.chapter.miniGame.desc} round={st.idx} total={rounds.length} lives={st.lives} score={st.score} coins={st.coins} result={st.result} onRestart={() => { st.reset(); setSeed((s) => s + 1); setDone(false); p.onRestart(); }} onExit={p.onExit} onNext={p.onNext}>
      <div className="mb-2 text-center text-sm text-white/85">
        <MathText>{round.prompt}</MathText>
      </div>
      <canvas ref={cvRef} width={720} height={200} className="mb-3 w-full border-4 border-[#0b0620]" />
      <div className="mb-1 flex items-center justify-center gap-2 text-[11px]">
        <span className="inline-block h-3 w-6 bg-[#fbd000]" /> คลื่นเป้าหมาย
        <span className="ml-3 inline-block h-3 w-6 bg-[#00e5ff]" /> คลื่นของเรา
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="pixel-box bg-[#1b1140] p-3 text-xs">
          🎚️ Amplitude (A) = <b className="font-pixel text-[#fbd000]">{A}</b>
          <input type="range" min={1} max={4} step={1} value={A} disabled={done} onChange={(e) => { setA(+e.target.value); sfx.tick(); }} className="mt-2 w-full accent-[#fbd000]" />
        </label>
        <label className="pixel-box bg-[#1b1140] p-3 text-xs">
          🎚️ ความถี่ (B) = <b className="font-pixel text-[#fbd000]">{B}</b> → คาบ = <MathText>{`\\(\\frac{2\\pi}{${B}}\\)`}</MathText>
          <input type="range" min={1} max={4} step={1} value={B} disabled={done} onChange={(e) => { setB(+e.target.value); sfx.tick(); }} className="mt-2 w-full accent-[#00e5ff]" />
        </label>
      </div>
      {!done ? (
        <button onClick={drop} className="pixel-btn mt-3 w-full bg-[#00a800] px-3 py-3 text-sm text-white">🎧 DROP BEAT!</button>
      ) : (
        <div className="mt-3 border-4 border-[#0b0620] bg-[#1b1140] p-3 text-sm text-white">
          <p className="font-pixel text-[10px] text-[#fbd000]">{match ? "คลื่นตรงเป๊ะ! คนดูเดือด! 🔥" : "คลื่นเพี้ยน... คนดูโห่ 📉"}</p>
          <p className="mt-1 text-white/85"><MathText>{round.explain}</MathText></p>
          <button onClick={goNext} className="pixel-btn mt-2 w-full bg-[#fbd000] px-3 py-2 text-xs text-[#0b0620]">▶ เพลงถัดไป</button>
        </div>
      )}
    </MiniGameFrame>
  );
}
