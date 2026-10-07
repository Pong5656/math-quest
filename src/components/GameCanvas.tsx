"use client";

// ===== เกมมาริโอ 8 บิตหลัก: เดิน กระโดด ชนบล็อก ? เพื่อตอบโจทย์ =====
// เก็บเหรียญจากการตอบถูก + เก็บเห็ด/ดาวในด่าน + ชนธงชัยเพื่อชนะ

import { useEffect, useRef, useState } from "react";
import type { Chapter, Question } from "@/lib/types";
import { addCoins, addScore, awardBadge, bumpStreak, getSave, markDone, recordAnswer, useItem } from "@/lib/store";
import { sfx } from "@/lib/sfx";
import QuizModal from "./QuizModal";
import HeartBar from "./HeartBar";
import Confetti from "./Confetti";
import { PixelButton } from "./ui";

const W = 960;
const H = 540;
const GROUND = 470;
const GRAV = 0.9;
const JUMP = -15.5;
const SPEED = 4.3;
const MAX_HEARTS = 4;

interface Block {
  q: Question;
  x: number;
  y: number;
  used: boolean;
  bump: number;
}
interface Pickup {
  x: number;
  y: number;
  kind: "coin" | "heart" | "star";
  taken: boolean;
}
type Status = "ready" | "playing" | "quiz" | "win" | "over";

// สไปรต์ฮีโร่พิกเซล 12x16 (R=แดง, B=น้ำเงิน, S=ผิว, H=น้ำตาล)
const SPR = [
  "....RRRR....",
  "...RRRRRR...",
  "...HHSSHS...",
  "..HSSSSSS...",
  "..HSSSSSS...",
  "...SSSSS....",
  "...RRRRR....",
  "..RRBRRBR...",
  ".RRRBBBRRR..",
  ".SSBBBBBSS..",
  ".SSBBBBBSS..",
  "..BBBBBBB...",
  "..BBB.BBB...",
  "..BBB.BBB...",
  ".HHH...HHH..",
  ".HHH...HHH..",
];
const SPR_COLORS: Record<string, string> = {
  R: "#e52521",
  B: "#2a5fd0",
  S: "#ffcb9e",
  H: "#5c3317",
};

export default function GameCanvas({ chapter }: { chapter: Chapter }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<Status>("ready");
  const [hearts, setHearts] = useState(3);
  const [runCoins, setRunCoins] = useState(0);
  const [shield, setShield] = useState(false);
  const [inv, setInv] = useState(getSave().inv);
  const [activeBlock, setActiveBlock] = useState<Block | null>(null);
  const [toast, setToast] = useState("");
  const [answered, setAnswered] = useState(0);
  const [correctN, setCorrectN] = useState(0);

  const st = useRef({ px: 80, py: GROUND - 48, vx: 0, vy: 0, onGround: true, face: 1, camX: 0, t: 0, jumpHeld: false });
  const keys = useRef({ left: false, right: false, jump: false });
  const blocks = useRef<Block[]>([]);
  const pickups = useRef<Pickup[]>([]);
  const heartsR = useRef(3);
  const shieldR = useRef(false);
  const coinsR = useRef(0);
  const correctR = useRef(0);
  const answeredR = useRef(0);
  const flagX = useRef(3900);
  const worldW = useRef(4300);
  const statusR = useRef<Status>("ready");

  const setStatusAll = (s: Status) => {
    statusR.current = s;
    setStatus(s);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 1800);
  };

  /** สร้างด่านจากโจทย์ของบท */
  const buildLevel = () => {
    const qs = chapter.questions.slice(0, 12);
    blocks.current = qs.map((q, i) => ({ q, x: 430 + i * 275, y: i % 2 === 0 ? 330 : 288, used: false, bump: 0 }));
    const pk: Pickup[] = [];
    qs.forEach((_, i) => {
      const base = 430 + i * 275;
      pk.push({ x: base + 130, y: 400, kind: "coin", taken: false });
      pk.push({ x: base + 160, y: 380, kind: "coin", taken: false });
      pk.push({ x: base + 190, y: 400, kind: "coin", taken: false });
    });
    // เห็ดฮีลเลือด 2 ดอก + ดาวป้องกัน 1 ดวงระหว่างทาง
    pk.push({ x: 1500, y: GROUND - 30, kind: "heart", taken: false });
    pk.push({ x: 2900, y: GROUND - 30, kind: "heart", taken: false });
    pk.push({ x: 2200, y: GROUND - 40, kind: "star", taken: false });
    pickups.current = pk;
    flagX.current = 430 + qs.length * 275 + 200;
    worldW.current = flagX.current + 420;
  };

  /** เริ่ม/รีสตาร์ตเกม */
  const start = () => {
    buildLevel();
    st.current = { px: 80, py: GROUND - 48, vx: 0, vy: 0, onGround: true, face: 1, camX: 0, t: 0, jumpHeld: false };
    heartsR.current = 3;
    shieldR.current = false;
    coinsR.current = 0;
    correctR.current = 0;
    answeredR.current = 0;
    setHearts(3);
    setShield(false);
    setRunCoins(0);
    setAnswered(0);
    setCorrectN(0);
    setInv(getSave().inv);
    setActiveBlock(null);
    bumpStreak();
    setStatusAll("playing");
    sfx.powerup();
  };

  // ===== คีย์บอร์ด =====
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", " ", "Spacebar"].includes(e.key)) e.preventDefault();
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.current.left = true;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.current.right = true;
      if (e.key === "ArrowUp" || e.key === " " || e.key === "w" || e.key === "W") keys.current.jump = true;
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.current.left = false;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.current.right = false;
      if (e.key === "ArrowUp" || e.key === " " || e.key === "w" || e.key === "W") keys.current.jump = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // ===== ชนะด่าน =====
  const winLevel = () => {
    setStatusAll("win");
    sfx.fanfare();
    awardBadge(`game:${chapter.id}`);
    markDone(chapter.id, "game");
    addCoins(coinsR.current + 30);
    addScore(200 + correctR.current * 50);
  };

  // ===== ลูปเกม =====
  useEffect(() => {
    buildLevel();
    let raf = 0;
    const cvs = canvasRef.current;
    const ctx = cvs?.getContext("2d");
    if (!ctx) return;

    const update = () => {
      const s = st.current;
      s.t += 1;
      // เดินซ้าย-ขวา
      if (keys.current.left) {
        s.vx = -SPEED;
        s.face = -1;
      } else if (keys.current.right) {
        s.vx = SPEED;
        s.face = 1;
      } else s.vx *= 0.7;
      // กระโดด
      if (keys.current.jump && s.onGround && !s.jumpHeld) {
        s.vy = JUMP;
        s.onGround = false;
        s.jumpHeld = true;
        sfx.jump();
      }
      if (!keys.current.jump) s.jumpHeld = false;

      s.vy += GRAV;
      if (s.vy > 18) s.vy = 18;
      s.px += s.vx;
      s.py += s.vy;
      if (s.px < 10) s.px = 10;
      if (s.px > worldW.current - 40) s.px = worldW.current - 40;

      // พื้นดิน
      if (s.py >= GROUND - 48) {
        s.py = GROUND - 48;
        s.vy = 0;
        s.onGround = true;
      }

      // ชนบล็อก ?
      const PW = 34, PH = 48, BS = 44;
      for (const b of blocks.current) {
        if (b.bump > 0) b.bump -= 1;
        const bx = b.x, by = b.y - b.bump;
        const overlapX = s.px + PW > bx && s.px < bx + BS;
        const overlapY = s.py + PH > by && s.py < by + BS;
        if (!overlapX || !overlapY) continue;
        const prevBottom = s.py + PH - s.vy;
        const prevTop = s.py - s.vy;
        if (s.vy < 0 && prevTop >= by + BS - 14) {
          // โขกบล็อกจากด้านล่าง → เปิดโจทย์
          s.vy = 2;
          s.py = by + BS;
          if (!b.used) {
            b.bump = 10;
            setStatusAll("quiz");
            setActiveBlock(b);
            sfx.coin();
          }
        } else if (s.vy >= 0 && prevBottom <= by + 14) {
          // ยืนบนบล็อก
          s.py = by - PH;
          s.vy = 0;
          s.onGround = true;
        } else if (s.px + PW / 2 < bx + BS / 2) {
          s.px = bx - PW;
        } else {
          s.px = bx + BS;
        }
      }

      // เก็บไอเทม
      for (const p of pickups.current) {
        if (p.taken) continue;
        const dx = s.px + PW / 2 - p.x;
        const dy = s.py + PH / 2 - p.y;
        if (Math.abs(dx) < 34 && Math.abs(dy) < 40) {
          p.taken = true;
          if (p.kind === "coin") {
            coinsR.current += 2;
            setRunCoins((c) => c + 2);
            sfx.coin();
          } else if (p.kind === "heart") {
            if (heartsR.current < MAX_HEARTS) {
              heartsR.current += 1;
              setHearts(heartsR.current);
              showToast("🍄 เก็บเห็ด! หัวใจ +1");
            } else showToast("❤️ หัวใจเต็มแล้ว!");
            sfx.powerup();
          } else {
            shieldR.current = true;
            setShield(true);
            showToast("⭐ ได้ดาวป้องกัน! ตอบผิดได้ฟรี 1 ครั้ง");
            sfx.powerup();
          }
        }
      }

      // กล้องตามผู้เล่น
      s.camX = Math.max(0, Math.min(s.px - 320, worldW.current - W));

      // ชนธงชัย
      if (s.px + PW > flagX.current) winLevel();
    };

    const drawCloud = (x: number, y: number, sc: number) => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x, y, 46 * sc, 18 * sc);
      ctx.fillRect(x + 10 * sc, y - 10 * sc, 26 * sc, 10 * sc);
      ctx.fillRect(x - 8 * sc, y + 6 * sc, 62 * sc, 8 * sc);
    };

    const drawHero = (x: number, y: number, face: number, t: number, moving: boolean) => {
      ctx.save();
      ctx.translate(x + 17, y);
      ctx.scale(face, 1);
      const cell = 3;
      const bob = moving && Math.floor(t / 6) % 2 === 0 ? 1 : 0;
      for (let r = 0; r < SPR.length; r++) {
        for (let c = 0; c < 12; c++) {
          const ch = SPR[r][c];
          if (ch === ".") continue;
          ctx.fillStyle = SPR_COLORS[ch];
          ctx.fillRect((c - 6) * cell, r * cell + bob, cell, cell);
        }
      }
      ctx.restore();
    };

    const draw = () => {
      const s = st.current;
      // ท้องฟ้า
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#4aa8f5");
      grad.addColorStop(0.7, "#8fd6ff");
      grad.addColorStop(1, "#c8ecff");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      // เมฆพิกเซล
      for (let i = 0; i < Math.ceil(worldW.current / 400); i++) {
        const cx = i * 400 + 100 - s.camX * 0.5;
        if (cx > -120 && cx < W + 60) drawCloud(cx, 60 + (i % 3) * 46, 1 + (i % 2) * 0.5);
      }
      // พุ่มไม้/ภูเขา
      ctx.fillStyle = "#3faa3f";
      for (let i = 0; i < Math.ceil(worldW.current / 600); i++) {
        const hx = i * 600 + 200 - s.camX * 0.8;
        if (hx > -200 && hx < W + 100) {
          ctx.beginPath();
          ctx.moveTo(hx, GROUND);
          ctx.lineTo(hx + 90, GROUND - 110);
          ctx.lineTo(hx + 180, GROUND);
          ctx.fill();
        }
      }

      ctx.save();
      ctx.translate(-s.camX, 0);

      // พื้นอิฐ
      for (let x = Math.floor(s.camX / 32) * 32; x < s.camX + W + 32; x += 32) {
        ctx.fillStyle = "#b45309";
        ctx.fillRect(x, GROUND, 32, H - GROUND);
        ctx.fillStyle = "#8a3a06";
        ctx.fillRect(x, GROUND, 32, 4);
        ctx.fillRect(x + 30, GROUND, 2, H - GROUND);
        ctx.fillRect(x, GROUND + 34, 32, 2);
        ctx.fillStyle = "#d97706";
        ctx.fillRect(x + 2, GROUND + 6, 26, 6);
      }
      // หญ้าด้านบน
      ctx.fillStyle = "#2e9e2e";
      ctx.fillRect(s.camX, GROUND - 6, W, 6);

      // บล็อก ?
      for (const b of blocks.current) {
        const by = b.y - b.bump;
        ctx.fillStyle = b.used ? "#8d8d8d" : "#fbbf24";
        ctx.fillRect(b.x, by, 44, 44);
        ctx.strokeStyle = b.used ? "#555" : "#92400e";
        ctx.lineWidth = 4;
        ctx.strokeRect(b.x + 2, by + 2, 40, 40);
        if (!b.used) {
          ctx.fillStyle = "#92400e";
          ctx.font = '20px "Press Start 2P", monospace';
          ctx.fillText("?", b.x + 14, by + 32);
          ctx.fillRect(b.x + 5, by + 5, 4, 4);
          ctx.fillRect(b.x + 35, by + 5, 4, 4);
          ctx.fillRect(b.x + 5, by + 35, 4, 4);
          ctx.fillRect(b.x + 35, by + 35, 4, 4);
        }
      }

      // ไอเทมเก็บ
      for (const p of pickups.current) {
        if (p.taken) continue;
        const bob = Math.sin(s.t / 12 + p.x) * 4;
        if (p.kind === "coin") {
          const wobble = Math.abs(Math.sin(s.t / 10 + p.x));
          ctx.fillStyle = "#fbbf24";
          ctx.beginPath();
          ctx.ellipse(p.x, p.y + bob, 10 * (0.4 + wobble * 0.6), 12, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#92400e";
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (p.kind === "heart") {
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(p.x - 12, p.y - 8 + bob, 10, 8);
          ctx.fillRect(p.x + 2, p.y - 8 + bob, 10, 8);
          ctx.fillRect(p.x - 14, p.y - 2 + bob, 28, 8);
          ctx.fillRect(p.x - 8, p.y + 6 + bob, 16, 6);
          ctx.fillRect(p.x - 3, p.y + 12 + bob, 6, 5);
        } else {
          ctx.fillStyle = "#fde047";
          ctx.beginPath();
          for (let i = 0; i < 10; i++) {
            const ang = (Math.PI / 5) * i - Math.PI / 2;
            const rad = i % 2 === 0 ? 16 : 7;
            ctx.lineTo(p.x + Math.cos(ang) * rad, p.y + bob + Math.sin(ang) * rad);
          }
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "#a16207";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // ธงชัย + ปราสาท
      const fx = flagX.current;
      ctx.fillStyle = "#e5e7eb";
      ctx.fillRect(fx, GROUND - 230, 8, 230);
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(fx + 4, GROUND - 234, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#16a34a";
      ctx.beginPath();
      ctx.moveTo(fx + 8, GROUND - 224);
      ctx.lineTo(fx + 60, GROUND - 204);
      ctx.lineTo(fx + 8, GROUND - 184);
      ctx.fill();
      ctx.fillStyle = "#92400e";
      ctx.fillRect(fx + 90, GROUND - 120, 130, 120);
      ctx.fillStyle = "#7c2d12";
      ctx.fillRect(fx + 140, GROUND - 60, 34, 60);
      ctx.fillRect(fx + 90, GROUND - 140, 26, 20);
      ctx.fillRect(fx + 142, GROUND - 140, 26, 20);
      ctx.fillRect(fx + 194, GROUND - 140, 26, 20);

      // ผู้เล่น
      drawHero(s.px, s.py, s.face, s.t, Math.abs(s.vx) > 0.5 && s.onGround);

      ctx.restore();
    };

    const loop = () => {
      if (statusR.current === "playing") update();
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapter.id]);

  // ===== คำตอบถูก/ผิด =====
  const handleCorrect = () => {
    if (!activeBlock) return;
    activeBlock.used = true;
    coinsR.current += 10;
    correctR.current += 1;
    answeredR.current += 1;
    setRunCoins((c) => c + 10);
    setCorrectN(correctR.current);
    setAnswered(answeredR.current);
    recordAnswer(chapter.id, activeBlock.q.id, true);
    addScore(50);
    sfx.coin();
    setActiveBlock(null);
    setStatusAll("playing");
  };

  const handleWrong = () => {
    if (!activeBlock) return;
    recordAnswer(chapter.id, activeBlock.q.id, false);
    if (shieldR.current) {
      shieldR.current = false;
      setShield(false);
      showToast("⭐ ดาวป้องกันรับเคราะห์แทน!");
      return;
    }
    heartsR.current -= 1;
    setHearts(heartsR.current);
    sfx.hit();
    if (heartsR.current <= 0) {
      setActiveBlock(null);
      setStatusAll("over");
    }
  };

  // ===== ใช้ไอเทมจากกระเป๋า =====
  const eatMushroom = () => {
    if (hearts >= MAX_HEARTS) {
      showToast("หัวใจเต็มแล้ว!");
      return;
    }
    if (useItem("mushroom")) {
      setHearts((h) => {
        heartsR.current = h + 1;
        return h + 1;
      });
      setInv(getSave().inv);
      sfx.powerup();
      showToast("🍄 กินเห็ด หัวใจ +1!");
    } else showToast("ไม่มีเห็ดแล้ว — ซื้อที่ร้านค้าก่อนเริ่มด่าน");
  };

  const useStar = () => {
    if (shield) {
      showToast("มีดาวป้องกันอยู่แล้ว");
      return;
    }
    if (useItem("star")) {
      shieldR.current = true;
      setShield(true);
      setInv(getSave().inv);
      sfx.powerup();
      showToast("⭐ โล่ดาวเปิดใช้งาน!");
    } else showToast("ไม่มีดาวแล้ว — ซื้อที่ร้านค้าก่อนเริ่มด่าน");
  };

  const totalQ = Math.min(chapter.questions.length, 12);

  return (
    <div className="relative mx-auto w-full max-w-5xl">
      {/* HUD */}
      <div className="mb-2 flex flex-wrap items-center gap-3 rounded-sm border-4 border-[#23273a] bg-[#23273a] px-3 py-2 text-white">
        <HeartBar hearts={hearts} max={MAX_HEARTS} />
        {shield ? <span className="text-sm font-bold text-yellow-300">⭐ โล่เปิด</span> : null}
        <span className="font-pixel text-[10px] text-yellow-300">🪙 {runCoins}</span>
        <span className="font-pixel text-[10px] text-green-300">✅ {correctN}/{totalQ}</span>
        <div className="ml-auto flex items-center gap-2">
          <button type="button" onClick={eatMushroom} className="pixel-btn rounded-sm bg-rose-300 px-2 py-1 text-xs font-bold">
            🍄 x{inv.mushroom}
          </button>
          <button type="button" onClick={useStar} className="pixel-btn rounded-sm bg-yellow-300 px-2 py-1 text-xs font-bold">
            ⭐ x{inv.star}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative overflow-hidden rounded-sm border-4 border-[#23273a] shadow-[8px_8px_0_rgba(23,27,42,0.4)]">
        <canvas ref={canvasRef} width={W} height={H} className="game-canvas block w-full" />
        {toast ? (
          <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-sm border-4 border-[#23273a] bg-white/95 px-4 py-2 text-sm font-bold shadow-lg">
            {toast}
          </div>
        ) : null}

        {/* พร้อมเริ่ม */}
        {status === "ready" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 p-4">
            <div className="pixel-card max-w-md bg-[#fff8e7] p-5 text-center">
              <p className="font-pixel text-sm leading-6 text-amber-700">ด่านที่ {chapter.emoji} {chapter.short}</p>
              <p className="mt-3 text-sm font-medium">
                วิ่งชน <b>บล็อก ?</b> จากด้านล่างเพื่อตอบโจทย์ 🟢🟡🔴 — ตอบถูกได้เหรียญ ตอบผิดเสียหัวใจ
                เก็บ 🍄 เพื่อฮีลเลือด เก็บ ⭐ เพื่อป้องกันคำตอบผิด แล้วไปชน <b>ธงชัย</b> ให้ได้!
              </p>
              <p className="mt-2 text-xs text-slate-600">ควบคุม: ← → ↑ / Space (มือถือใช้ปุ่มบนจอ)</p>
              <PixelButton className="mt-4" onClick={start} color="bg-green-400">▶ เริ่มด่าน!</PixelButton>
            </div>
          </div>
        ) : null}

        {/* ชนะ */}
        {status === "win" ? (
          <>
            <Confetti />
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 p-4">
              <div className="pixel-card max-w-md bg-[#fff8e7] p-6 text-center">
                <p className="font-pixel text-base leading-7 text-green-700">🏁 CLEAR!</p>
                <p className="mt-2 text-lg font-extrabold">พิชิตด่าน {chapter.emoji} {chapter.short} สำเร็จ!</p>
                <div className="mt-3 space-y-1 text-sm font-semibold">
                  <p>🪙 เหรียญที่ได้: {runCoins + 30} (โบนัสผ่านด่าน +30)</p>
                  <p>✅ ตอบถูก {correctN} ข้อ · ⭐ +{200 + correctN * 50} คะแนน</p>
                  <p className="text-amber-700">🏅 ได้รับ Badge: "ผู้พิชิต{chapter.short}"</p>
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <PixelButton onClick={start}>🔄 เล่นอีกครั้ง</PixelButton>
                  <PixelButton color="bg-sky-400" href={`/chapter/${chapter.id}/mode`}>🎮 โหมดอื่นของบทนี้</PixelButton>
                </div>
              </div>
            </div>
          </>
        ) : null}

        {/* Game Over */}
        {status === "over" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-4">
            <div className="pixel-card max-w-md bg-[#1a1c26] p-6 text-center text-white">
              <p className="font-pixel text-base text-red-400">GAME OVER 💀</p>
              <p className="mt-3 text-sm">หัวใจหมดแล้ว... ไม่เป็นไร! อ่านทริกในเฉลยอีกครั้งแล้วลุยใหม่ ครูเป็นกำลังใจให้!</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <PixelButton onClick={start}>🔄 เล่นใหม่</PixelButton>
                <PixelButton color="bg-sky-400" href={`/chapter/${chapter.id}/study`}>📖 ไปทบทวนบทเรียน</PixelButton>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* ปุ่มควบคุมบนจอมือถือ */}
      <div className="mt-3 flex items-center justify-between gap-2 sm:hidden">
        <div className="flex gap-2">
          <TouchBtn label="◀" onHold={(v) => (keys.current.left = v)} />
          <TouchBtn label="▶" onHold={(v) => (keys.current.right = v)} />
        </div>
        <TouchBtn label="⤒ กระโดด" onHold={(v) => (keys.current.jump = v)} wide />
      </div>
      <p className="mt-2 hidden text-center text-xs text-slate-700 sm:block">
        ใช้ปุ่ม ← → เพื่อเดิน และ ↑ / Space เพื่อกระโดด · ชนบล็อก ? จากด้านล่างเพื่อตอบโจทย์
      </p>

      {/* โมดัลโจทย์ */}
      {status === "quiz" && activeBlock ? (
        <QuizModal
          q={activeBlock.q}
          onCorrect={handleCorrect}
          onWrong={handleWrong}
          allowRetry={hearts > 0}
          retryLeft={hearts}
          hintCount={inv.hint}
          onUseHint={() => {
            const ok = useItem("hint");
            if (ok) setInv(getSave().inv);
            return ok;
          }}
        />
      ) : null}
    </div>
  );
}

/** ปุ่มกดบนจอสำหรับมือถือ */
function TouchBtn({ label, onHold, wide }: { label: string; onHold: (v: boolean) => void; wide?: boolean }) {
  return (
    <button
      type="button"
      className={`pixel-btn select-none rounded-sm bg-yellow-400 px-5 py-4 font-pixel text-sm text-[#23273a] ${wide ? "flex-1" : ""}`}
      style={{ touchAction: "none" }}
      onPointerDown={(e) => {
        e.preventDefault();
        onHold(true);
      }}
      onPointerUp={() => onHold(false)}
      onPointerLeave={() => onHold(false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {label}
    </button>
  );
}
