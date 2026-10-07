"use client";
// ══════════════════════════════════════════════════════════
// GameCanvas — ด่านมาริโอ 8-Bit ประจำบท
//  • ตัวละครพิกเซล เดินซ้าย-ขวา กระโดด (คีย์บอร์ด ← → ↑ / Space + ปุ่มจอมือถือ)
//  • ชน "บล็อก ?" → QuizModal (ตอบถูก +10 เหรียญ / ตอบผิด เสียหัวใจ 1 จาก 3 + เฉลยทีละขั้น แล้วตอบใหม่ได้)
//  • เก็บเห็ด 🍄 ฮีลเลือด / เก็บเหรียญ 🪙 / เหยียบศัตรู
//  • ร้านค้า 🏪 ใช้เหรียญที่เก็บมาซื้อไอเทมช่วย (ตัดช้อยส์ / โล่กันผิด / ดาวคะแนน ×2)
//  • ชนธงชัย 🚩 = ชนะด่าน → confetti + Badge
// ══════════════════════════════════════════════════════════
import { useCallback, useEffect, useRef, useState } from "react";
import type { Chapter, Question } from "@/lib/types";
import { pickQuestions } from "@/data";
import { addWrong, loadState, saveState } from "@/lib/storage";
import { sfx } from "@/lib/sound";
import HeartBar from "./HeartBar";
import Confetti from "./Confetti";
import QuizModal from "./QuizModal";

const TILE = 32;
const VIEW_W = 960;
const VIEW_H = 480;
const ROWS = 15;
const COLS = 170;

/** ชนิดของไทล์ในด่าน */
const SOLID = new Set(["#", "B", "?", "U", "S", "P"]);

interface Enemy {
  x: number;
  y: number;
  vx: number;
  alive: boolean;
  t: number;
}
interface FloatText {
  x: number;
  y: number;
  txt: string;
  life: number;
}
interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  onGround: boolean;
  face: 1 | -1;
  inv: number;
  walk: number;
}

/** สร้างด่านแบบสุ่มตามบท (โซนต้น = โจทย์ง่าย / กลาง = กลาง / ท้าย = ยาก) */
function buildLevel() {
  const map: string[][] = Array.from({ length: ROWS }, () => Array<string>(COLS).fill(" "));
  const pits: number[] = [];
  // ขุดหลุมเป็นช่วง ๆ (เว้นช่วงเริ่มต้นและช่วงท้าย)
  for (let x = 18; x < COLS - 14; x += 1) {
    if (Math.random() < 0.035 && pits.length < 14) pits.push(x);
  }
  const pitSet = new Set<number>();
  pits.forEach((p) => {
    const w = 2 + Math.floor(Math.random() * 2);
    for (let k = 0; k < w; k++) pitSet.add(p + k);
  });

  for (let x = 0; x < COLS; x++) {
    // พื้นอิฐ
    if (!pitSet.has(x)) {
      map[13][x] = "#";
      map[14][x] = "#";
    }
    // เมฆประดับ
    if (x % 17 === 3) map[2][x] = "X";
    if (x % 23 === 11) map[3][x] = "X";
    // ภูเขา
    if (x % 31 === 7) map[12][x] = "H";
  }

  // แท่นอิฐ + บล็อกคำถาม (กระจายตามความยาวด่าน)
  const qPositions: number[] = [];
  for (let x = 12; x < COLS - 16; x += 1) {
    if (Math.random() < 0.055) {
      const y = 9 + Math.floor(Math.random() * 2);
      const len = 3 + Math.floor(Math.random() * 3);
      for (let k = 0; k < len && x + k < COLS - 16; k++) {
        const isQ = k === Math.floor(len / 2);
        map[y][x + k] = isQ ? "?" : "B";
        if (isQ && qPositions.length < 16) qPositions.push(x + k);
        // เหรียญเหนือแท่น
        if (!isQ && Math.random() < 0.6) map[y - 1][x + k] = "C";
      }
      x += len + 3;
    }
  }
  // เหรียญบนพื้น + เห็ดฮีลเลือด
  for (let x = 8; x < COLS - 12; x++) {
    if (!pitSet.has(x) && Math.random() < 0.045) map[12][x] = "C";
    if (!pitSet.has(x) && Math.random() < 0.012) map[11][x] = "M";
    if (!pitSet.has(x) && Math.random() < 0.012) map[12][x] = "E";
    if (Math.random() < 0.014 && !pitSet.has(x) && x > 20) {
      map[12][x] = "P";
      map[11][x] = "P";
    }
  }
  // ร้านค้า 2 จุด (ใช้เหรียญซื้อไอเทมช่วย)
  [46, 104].forEach((sx) => {
    map[9][sx] = "S";
    map[10][sx] = "B";
  });
  // ธงชัยท้ายด่าน
  for (let y = 4; y <= 12; y++) map[y][COLS - 8] = "F";
  map[13][COLS - 8] = "#";
  map[14][COLS - 8] = "#";

  return { map, pitSet, qPositions };
}

/** เลือกระดับโจทย์ตามตำแหน่งในด่าน: ต้น=ง่าย กลาง=กลาง ท้าย=ยาก */
function diffAt(x: number): "easy" | "medium" | "hard" {
  if (x < COLS * 0.38) return "easy";
  if (x < COLS * 0.72) return "medium";
  return "hard";
}

export interface GameResult {
  win: boolean;
  correct: number;
  wrong: number;
  coins: number;
  score: number;
  badgeName?: string;
}

export default function GameCanvas({
  chapter,
  onFinish,
}: {
  chapter: Chapter;
  onFinish: (r: GameResult) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const levelRef = useRef(buildLevel());
  const playerRef = useRef<Player>({ x: 3 * TILE, y: 11 * TILE, vx: 0, vy: 0, onGround: false, face: 1, inv: 0, walk: 0 });
  const enemiesRef = useRef<Enemy[]>([]);
  const floatsRef = useRef<FloatText[]>([]);
  const keysRef = useRef({ left: false, right: false, jump: false });
  const camRef = useRef(0);
  const pausedRef = useRef(false);
  const starRef = useRef(0); // เวลาที่เหลือของดาวคะแนน ×2
  const pendingTileRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number>(0);

  const [status, setStatus] = useState<"ready" | "playing" | "gameover" | "win">("ready");
  const [hearts, setHearts] = useState(3);
  const [coins, setCoins] = useState(0);
  const [hint, setHint] = useState(1);
  const [shield, setShield] = useState(0);
  const [star, setStar] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [quiz, setQuiz] = useState<Question | null>(null);
  const [shop, setShop] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const heartsRef = useRef(3);
  const coinsRef = useRef(0);
  const shieldRef = useRef(0);
  const hintRef = useRef(1);
  const scoreRef = useRef(0);

  // ─────────────────────────────────────────────
  // เริ่มต้นศัตรูจากไทล์ 'E' ในด่าน
  useEffect(() => {
    const { map } = levelRef.current;
    const list: Enemy[] = [];
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++)
        if (map[y][x] === "E") {
          list.push({ x: x * TILE, y: y * TILE + 4, vx: -0.9, alive: true, t: Math.random() * 10 });
          map[y][x] = " ";
        }
    enemiesRef.current = list;
  }, []);

  const addFloat = (x: number, y: number, txt: string) => floatsRef.current.push({ x, y, txt, life: 60 });

  const loseHeart = useCallback((reason: string) => {
    const h = heartsRef.current;
    if (shieldRef.current > 0) {
      shieldRef.current -= 1;
      setShield(shieldRef.current);
      addFloat(playerRef.current.x, playerRef.current.y - 20, "🛡️ โล่รับแทน!");
      sfx.power();
      setMsg("โล่ป้องกันรับความเสียหายแทน 1 ครั้ง!");
      playerRef.current.inv = 90;
      return;
    }
    const nh = Math.max(0, h - 1);
    heartsRef.current = nh;
    setHearts(nh);
    sfx.wrong();
    setMsg(reason);
    playerRef.current.inv = 90;
    if (nh <= 0) {
      pausedRef.current = true;
      setStatus("gameover");
      sfx.gameover();
      onFinish({ win: false, correct, wrong, coins: coinsRef.current, score: scoreRef.current });
    }
  }, [correct, wrong, onFinish]);

  // ─────────────────────────────────────────────
  // วาดฉากทั้งหมด (พิกเซลอาร์ตสไตล์ Super Mario Bros)
  const draw = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const g = cv.getContext("2d");
    if (!g) return;
    const { map } = levelRef.current;
    const p = playerRef.current;
    const cam = camRef.current;

    // ท้องฟ้า
    const sky = g.createLinearGradient(0, 0, 0, VIEW_H);
    sky.addColorStop(0, "#5c94fc");
    sky.addColorStop(0.6, "#7fb2ff");
    sky.addColorStop(1, "#a8d8ff");
    g.fillStyle = sky;
    g.fillRect(0, 0, VIEW_W, VIEW_H);

    const x0 = Math.floor(cam / TILE);
    const x1 = Math.min(COLS - 1, x0 + Math.ceil(VIEW_W / TILE) + 1);

    // เมฆ + ภูเขา (parallax)
    for (let y = 0; y < ROWS; y++) {
      for (let x = x0; x <= x1; x++) {
        const ch = map[y][x];
        const sx = x * TILE - cam;
        const sy = y * TILE;
        if (ch === "X") {
          const cx = sx - cam * 0.15;
          g.fillStyle = "#ffffff";
          g.fillRect(cx + 6, sy + 8, 52, 12);
          g.fillRect(cx + 18, sy, 28, 12);
          g.fillStyle = "#dbeafe";
          g.fillRect(cx + 6, sy + 18, 52, 4);
        } else if (ch === "H") {
          g.fillStyle = "#00a800";
          g.fillRect(sx - 20, sy - 4, 72, 36);
          g.fillStyle = "#007800";
          g.fillRect(sx - 8, sy - 16, 48, 16);
        } else if (ch === "#") {
          g.fillStyle = "#c84c0c";
          g.fillRect(sx, sy, TILE, TILE);
          g.fillStyle = "#00000033";
          g.fillRect(sx, sy + TILE - 6, TILE, 6);
          g.fillStyle = "#e07b3f";
          g.fillRect(sx + 2, sy + 2, 12, 10);
          g.fillRect(sx + 18, sy + 2, 12, 10);
          g.fillRect(sx + 10, sy + 16, 12, 10);
          g.strokeStyle = "#0b0620";
          g.lineWidth = 2;
          g.strokeRect(sx + 1, sy + 1, TILE - 2, TILE - 2);
        } else if (ch === "B") {
          g.fillStyle = "#a33b0c";
          g.fillRect(sx, sy, TILE, TILE);
          g.strokeStyle = "#0b0620";
          g.lineWidth = 2;
          g.strokeRect(sx + 1, sy + 1, TILE - 2, TILE - 2);
          g.fillStyle = "#0b062066";
          g.fillRect(sx + 4, sy + 14, TILE - 8, 3);
        } else if (ch === "?" || ch === "U" || ch === "S") {
          const base = ch === "S" ? "#00a800" : ch === "?" ? "#fbd000" : "#8a6d3b";
          g.fillStyle = base;
          g.fillRect(sx, sy, TILE, TILE);
          g.strokeStyle = "#0b0620";
          g.lineWidth = 3;
          g.strokeRect(sx + 1, sy + 1, TILE - 2, TILE - 2);
          g.fillStyle = "#0b0620";
          g.font = "bold 18px 'Press Start 2P', monospace";
          g.textAlign = "center";
          g.fillText(ch === "S" ? "$" : ch === "?" ? "?" : "", sx + TILE / 2, sy + 22);
        } else if (ch === "P") {
          g.fillStyle = "#00a800";
          g.fillRect(sx, sy, TILE, TILE);
          g.fillStyle = "#007800";
          g.fillRect(sx + 4, sy, 6, TILE);
          g.strokeStyle = "#0b0620";
          g.lineWidth = 2;
          g.strokeRect(sx + 1, sy + 1, TILE - 2, TILE - 2);
        } else if (ch === "C") {
          const w = Math.abs(Math.sin(Date.now() / 220)) * 10 + 6;
          g.fillStyle = "#fbd000";
          g.fillRect(sx + TILE / 2 - w / 2, sy + 8, w, 16);
          g.strokeStyle = "#0b0620";
          g.lineWidth = 2;
          g.strokeRect(sx + TILE / 2 - w / 2, sy + 8, w, 16);
        } else if (ch === "M") {
          g.fillStyle = "#e53935";
          g.fillRect(sx + 6, sy + 6, 20, 12);
          g.fillStyle = "#fff";
          g.fillRect(sx + 10, sy + 9, 5, 5);
          g.fillRect(sx + 19, sy + 9, 5, 5);
          g.fillStyle = "#ffe0b2";
          g.fillRect(sx + 8, sy + 18, 16, 8);
          g.strokeStyle = "#0b0620";
          g.lineWidth = 2;
          g.strokeRect(sx + 6, sy + 6, 20, 20);
        } else if (ch === "F") {
          g.fillStyle = "#e0e0e0";
          g.fillRect(sx + 14, sy, 4, TILE);
          if (y === 4) {
            g.fillStyle = "#00a800";
            g.fillRect(sx + 18, sy + 2, 26, 16);
            g.fillStyle = "#fff";
            g.font = "10px monospace";
            g.textAlign = "left";
            g.fillText("GOAL", sx + 20, sy + 14);
          }
        }
      }
    }

    // ศัตรู (สไลม์โจทย์)
    enemiesRef.current.forEach((e) => {
      if (!e.alive) return;
      const sx = e.x - cam;
      if (sx < -60 || sx > VIEW_W + 60) return;
      const bob = Math.sin(e.t / 6) * 2;
      g.fillStyle = "#8d4b1f";
      g.fillRect(sx + 2, e.y + 6 + bob, 26, 18);
      g.fillStyle = "#c9793a";
      g.fillRect(sx + 4, e.y + bob, 22, 12);
      g.fillStyle = "#fff";
      g.fillRect(sx + 7, e.y + 4 + bob, 6, 6);
      g.fillRect(sx + 17, e.y + 4 + bob, 6, 6);
      g.fillStyle = "#0b0620";
      g.fillRect(sx + 9, e.y + 6 + bob, 3, 3);
      g.fillRect(sx + 19, e.y + 6 + bob, 3, 3);
    });

    // ตัวละครผู้เล่น (พิกเซลอาร์ต)
    const psx = p.x - cam;
    const blink = p.inv > 0 && Math.floor(p.inv / 5) % 2 === 0;
    if (!blink) {
      const step = Math.floor(p.walk / 6) % 2 === 0 ? 0 : 2;
      g.fillStyle = "#e53935"; // หมวก
      g.fillRect(psx + 2, p.y, 18, 6);
      g.fillRect(psx - 2 * (p.face < 0 ? -1 : 1), p.y + 4, 22, 3);
      g.fillStyle = "#ffcc99"; // หน้า
      g.fillRect(psx + 4, p.y + 7, 14, 7);
      g.fillStyle = "#0b0620"; // ตา
      g.fillRect(psx + (p.face > 0 ? 13 : 6), p.y + 9, 3, 3);
      g.fillStyle = "#1565c0"; // เอี๊ยม
      g.fillRect(psx + 3, p.y + 14, 16, 10);
      g.fillStyle = "#e53935"; // แขนเสื้อ
      g.fillRect(psx, p.y + 14, 4, 8);
      g.fillRect(psx + 18, p.y + 14, 4, 8);
      g.fillStyle = "#6d4c41"; // รองเท้า
      g.fillRect(psx + 2, p.y + 24 + step, 8, 5);
      g.fillRect(psx + 12, p.y + 24 - step, 8, 5);
      if (starRef.current > 0) {
        g.fillStyle = `hsl(${(Date.now() / 6) % 360},100%,60%)`;
        g.fillRect(psx - 3, p.y - 3, 28, 3);
      }
    }

    // ข้อความลอย (+10, 🍄)
    g.font = "bold 13px 'Press Start 2P', monospace";
    g.textAlign = "center";
    floatsRef.current.forEach((f) => {
      g.fillStyle = `rgba(255,251,0,${Math.min(1, f.life / 40)})`;
      g.fillText(f.txt, f.x - cam, f.y);
    });
  }, []);

  // ─────────────────────────────────────────────
  // ฟิสิกส์ + การชน + เกมลูป
  const tileAt = (px: number, py: number) => {
    const tx = Math.floor(px / TILE);
    const ty = Math.floor(py / TILE);
    if (tx < 0 || tx >= COLS || ty < 0 || ty >= ROWS) return " ";
    return levelRef.current.map[ty][tx];
  };

  const isSolidAt = (px: number, py: number) => SOLID.has(tileAt(px, py));

  const step = useCallback(() => {
    const p = playerRef.current;
    const { map } = levelRef.current;
    const k = keysRef.current;
    const PW = 22;
    const PH = 29;

    // การเคลื่อนที่แนวนอน
    const acc = 0.55;
    const maxV = 3.4;
    if (k.left) {
      p.vx = Math.max(p.vx - acc, -maxV);
      p.face = -1;
    } else if (k.right) {
      p.vx = Math.min(p.vx + acc, maxV);
      p.face = 1;
    } else {
      p.vx *= 0.82;
      if (Math.abs(p.vx) < 0.1) p.vx = 0;
    }
    // กระโดด
    if (k.jump && p.onGround) {
      p.vy = -12.4;
      p.onGround = false;
      sfx.jump();
    }
    if (!k.jump && p.vy < -4) p.vy = -4; // กระโดดสั้นเมื่อกดแป๊บเดียว

    p.vy = Math.min(p.vy + 0.62, 13);
    p.walk += Math.abs(p.vx);

    // ชนแนวนอน
    p.x += p.vx;
    if (p.vx > 0 && (isSolidAt(p.x + PW, p.y + 2) || isSolidAt(p.x + PW, p.y + PH - 2))) {
      p.x = Math.floor((p.x + PW) / TILE) * TILE - PW - 0.1;
      p.vx = 0;
    } else if (p.vx < 0 && (isSolidAt(p.x, p.y + 2) || isSolidAt(p.x, p.y + PH - 2))) {
      p.x = Math.floor(p.x / TILE) * TILE + TILE + 0.1;
      p.vx = 0;
    }
    if (p.x < 0) p.x = 0;
    if (p.x > (COLS - 2) * TILE) p.x = (COLS - 2) * TILE;

    // ชนแนวตั้ง
    p.y += p.vy;
    p.onGround = false;
    if (p.vy > 0 && (isSolidAt(p.x + 2, p.y + PH) || isSolidAt(p.x + PW - 2, p.y + PH))) {
      p.y = Math.floor((p.y + PH) / TILE) * TILE - PH - 0.1;
      p.vy = 0;
      p.onGround = true;
    } else if (p.vy < 0 && (isSolidAt(p.x + 2, p.y) || isSolidAt(p.x + PW - 2, p.y))) {
      const ty = Math.floor(p.y / TILE);
      p.y = ty * TILE + TILE + 0.1;
      p.vy = 1;
      // โหม่งบล็อก: ? = คำถาม, S = ร้านค้า
      const tx = Math.floor((p.x + PW / 2) / TILE);
      const ch = map[ty][tx];
      if (ch === "?" && !pendingTileRef.current) {
        pendingTileRef.current = { x: tx, y: ty };
        pausedRef.current = true;
        sfx.bump();
        setQuiz(pickQuestions(chapter, diffAt(tx), 1)[0] ?? null);
      } else if (ch === "S" && !pendingTileRef.current) {
        pendingTileRef.current = { x: tx, y: ty };
        pausedRef.current = true;
        setShop(true);
        sfx.power();
      } else if (ch === "B") {
        sfx.bump();
      }
    }

    // ตกเหว
    if (p.y > ROWS * TILE + 60) {
      p.x = Math.max(2 * TILE, p.x - 6 * TILE);
      p.y = 6 * TILE;
      p.vy = 0;
      loseHeart("ตกเหว! เสียหัวใจ 1 ดวง 💔");
    }

    // เก็บไอเทมที่ทับ
    const cx = Math.floor((p.x + PW / 2) / TILE);
    for (let ty = Math.floor(p.y / TILE); ty <= Math.floor((p.y + PH) / TILE); ty++) {
      for (let tx = Math.floor(p.x / TILE); tx <= Math.floor((p.x + PW) / TILE); tx++) {
        if (tx < 0 || tx >= COLS || ty < 0 || ty >= ROWS) continue;
        const ch = map[ty][tx];
        if (ch === "C") {
          map[ty][tx] = " ";
          const gain = starRef.current > 0 ? 2 : 1;
          coinsRef.current += gain;
          setCoins(coinsRef.current);
          addFloat(tx * TILE + 16, ty * TILE, `+${gain}🪙`);
          sfx.coin();
        } else if (ch === "M") {
          map[ty][tx] = " ";
          heartsRef.current = Math.min(5, heartsRef.current + 1);
          setHearts(heartsRef.current);
          addFloat(tx * TILE + 16, ty * TILE, "+1 ❤️");
          sfx.heal();
          setMsg("เก็บเห็ดฮีลเลือด! หัวใจ +1 ❤️");
        } else if (ch === "F") {
          // ชนธงชัย = ชนะด่าน
          pausedRef.current = true;
          setStatus("win");
          sfx.fanfare();
          const finalScore = scoreRef.current + heartsRef.current * 50 + coinsRef.current * 5;
          scoreRef.current = finalScore;
          setScore(finalScore);
          onFinish({
            win: true,
            correct,
            wrong,
            coins: coinsRef.current,
            score: finalScore,
            badgeName: `ผู้พิชิต${chapter.title}`,
          });
        } else if (ch === "?" && !pendingTileRef.current) {
          // เดินชนบล็อกคำถามด้านข้างก็เปิดโจทย์ได้ (เหมาะกับมือถือ)
          pendingTileRef.current = { x: tx, y: ty };
          pausedRef.current = true;
          sfx.bump();
          setQuiz(pickQuestions(chapter, diffAt(tx), 1)[0] ?? null);
        }
      }
    }
    void cx;

    // ศัตรูเคลื่อนที่ + การชน
    enemiesRef.current.forEach((e) => {
      if (!e.alive) return;
      e.t += 1;
      e.x += e.vx;
      const front = e.vx > 0 ? e.x + 28 : e.x;
      if (isSolidAt(front, e.y + 12) || !isSolidAt(e.x + 14, e.y + 32)) e.vx *= -1;
      // ชนผู้เล่น
      if (p.inv <= 0 && Math.abs(e.x - p.x) < 24 && Math.abs(e.y - p.y) < 28) {
        if (p.vy > 0 && p.y + PH - 8 < e.y + 12) {
          e.alive = false;
          p.vy = -8;
          const gain = starRef.current > 0 ? 10 : 5;
          coinsRef.current += gain;
          setCoins(coinsRef.current);
          addFloat(e.x + 14, e.y, `+${gain}🪙 เหยียบ!`);
          sfx.stomp();
        } else {
          p.vx = p.x < e.x ? -5 : 5;
          p.vy = -6;
          loseHeart("ชนสไลม์โจทย์! เสียหัวใจ 1 ดวง 💔");
        }
      }
    });

    if (p.inv > 0) p.inv -= 1;
    if (starRef.current > 0) {
      starRef.current -= 1;
      setStar(Math.ceil(starRef.current / 60));
    }

    // ข้อความลอย
    floatsRef.current = floatsRef.current.filter((f) => (f.life -= 1) > 0);
    floatsRef.current.forEach((f) => (f.y -= 0.8));

    // กล้องตามผู้เล่น
    camRef.current = Math.max(0, Math.min(p.x - VIEW_W / 2 + 60, COLS * TILE - VIEW_W));
  }, [chapter, correct, wrong, loseHeart, onFinish]);

  useEffect(() => {
    let alive = true;
    const loop = () => {
      if (!alive) return;
      if (!pausedRef.current && status === "playing") step();
      draw();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      alive = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [draw, step, status]);

  // คีย์บอร์ด
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["arrowleft", "a"].includes(k)) keysRef.current.left = true;
      if (["arrowright", "d"].includes(k)) keysRef.current.right = true;
      if (["arrowup", "w", " ", "spacebar"].includes(k)) {
        keysRef.current.jump = true;
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["arrowleft", "a"].includes(k)) keysRef.current.left = false;
      if (["arrowright", "d"].includes(k)) keysRef.current.right = false;
      if (["arrowup", "w", " ", "spacebar"].includes(k)) keysRef.current.jump = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  /** สรุปผลคำตอบจาก QuizModal */
  const handleAnswer = (ok: boolean, _first: boolean, attempts: number) => {
    const tile = pendingTileRef.current;
    if (ok) {
      const gain = (starRef.current > 0 ? 20 : 10) * (attempts === 1 ? 1 : 1);
      coinsRef.current += gain;
      setCoins(coinsRef.current);
      scoreRef.current += gain * 3;
      setScore(scoreRef.current);
      setCorrect((c) => c + 1);
      if (tile) {
        levelRef.current.map[tile.y][tile.x] = "U";
        addFloat(tile.x * TILE + 16, tile.y * TILE - 6, `+${gain}🪙`);
      }
      sfx.coin();
    } else {
      setWrong((w) => w + 1);
      if (tile) levelRef.current.map[tile.y][tile.x] = "U";
      // เก็บข้อที่ตอบผิดลงสมุดจดข้อผิดอัตโนมัติ เพื่อทบทวนซ้ำภายหลัง
      if (quiz) saveState(addWrong(loadState(), quiz.id, chapter.id));
      loseHeart("ตอบผิด! เสียหัวใจ 1 ดวง 💔");
    }
    pendingTileRef.current = null;
    setQuiz(null);
    if (heartsRef.current > 0) pausedRef.current = false;
  };

  const buy = (item: "heart" | "shield" | "hint" | "star") => {
    const price = { heart: 30, shield: 40, hint: 20, star: 50 }[item];
    if (coinsRef.current < price) {
      sfx.bump();
      setMsg(`เหรียญไม่พอ! ต้องใช้ ${price} เหรียญ`);
      return;
    }
    coinsRef.current -= price;
    setCoins(coinsRef.current);
    sfx.power();
    if (item === "heart") {
      heartsRef.current = Math.min(5, heartsRef.current + 1);
      setHearts(heartsRef.current);
      setMsg("ซื้อเห็ดฮีลเลือด ❤️ +1");
    }
    if (item === "shield") {
      shieldRef.current += 1;
      setShield(shieldRef.current);
      setMsg("ซื้อโล่กันผิด 🛡️ (รับความเสียหายแทน 1 ครั้ง)");
    }
    if (item === "hint") {
      hintRef.current += 1;
      setHint(hintRef.current);
      setMsg("ซื้อกรรไกรตัดช้อยส์ ✂️");
    }
    if (item === "star") {
      starRef.current = 60 * 45;
      setStar(45);
      setMsg("ซื้อดาวพลัง ⭐ เหรียญ ×2 เป็นเวลา 45 วินาที");
    }
  };

  const restart = () => {
    levelRef.current = buildLevel();
    playerRef.current = { x: 3 * TILE, y: 11 * TILE, vx: 0, vy: 0, onGround: false, face: 1, inv: 0, walk: 0 };
    heartsRef.current = 3;
    setHearts(3);
    coinsRef.current = 0;
    setCoins(0);
    scoreRef.current = 0;
    setScore(0);
    shieldRef.current = 0;
    setShield(0);
    hintRef.current = 1;
    setHint(1);
    starRef.current = 0;
    setStar(0);
    setCorrect(0);
    setWrong(0);
    pendingTileRef.current = null;
    pausedRef.current = false;
    setStatus("playing");
    setMsg("");
  };

  return (
    <div className="relative w-full">
      {/* HUD */}
      <div className="mb-2 flex flex-wrap items-center gap-2 border-4 border-[#0b0620] bg-[#1b1140] p-2">
        <HeartBar hearts={hearts} max={5} />
        <span className="pixel-box flex items-center gap-1 bg-[#2a1a4a] px-2 py-1 text-xs font-bold text-[#fbd000]">
          🪙 <span className="font-pixel text-[10px]">{coins}</span>
        </span>
        <span className="pixel-box hidden items-center gap-1 bg-[#2a1a4a] px-2 py-1 text-xs font-bold text-[#7CFC00] sm:flex">
          ⭐ <span className="font-pixel text-[10px]">{score}</span>
        </span>
        <span className="pixel-box bg-[#2a1a4a] px-2 py-1 text-xs">✂️ {hint}</span>
        <span className="pixel-box bg-[#2a1a4a] px-2 py-1 text-xs">🛡️ {shield}</span>
        {star > 0 && <span className="pixel-box blink bg-fuchsia-700 px-2 py-1 text-xs">⭐×2 {star}s</span>}
        <span className="pixel-box ml-auto bg-[#2a1a4a] px-2 py-1 text-xs text-white/80">ถูก {correct} / ผิด {wrong}</span>
      </div>

      {/* จอเกม */}
      <div className="pixel-box relative overflow-hidden bg-[#5c94fc]">
        <canvas ref={canvasRef} width={VIEW_W} height={VIEW_H} className="block h-auto w-full" style={{ imageRendering: "pixelated" }} />

        {msg && status === "playing" && (
          <div className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 border-4 border-[#0b0620] bg-[#fbd000] px-3 py-1 text-xs font-bold text-[#0b0620]">
            {msg}
          </div>
        )}

        {/* หน้าเริ่ม */}
        {status === "ready" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 p-4 text-center">
            <p className="font-pixel text-sm text-[#fbd000] sm:text-lg">WORLD {chapter.id.toUpperCase()}</p>
            <p className="text-base font-bold text-white sm:text-xl">🍄 ด่านมาริโอ: {chapter.title}</p>
            <p className="max-w-md text-xs text-white/80">
              เดินไปชน <b className="text-[#fbd000]">บล็อก ?</b> เพื่อตอบโจทย์ เก็บ 🪙 เหรียญ และ 🍄 เห็ดฮีลเลือด
              เหยียบสไลม์ให้ได้เหรียญ แวะ <b className="text-green-400">ร้านค้า $</b> เพื่อซื้อไอเทมช่วย
              แล้วไปให้ถึง <b className="text-green-400">ธงชัย 🚩</b> ท้ายด่าน!
            </p>
            <p className="text-[11px] text-white/60">ควบคุม: ← → เดิน · ↑/Space กระโดด (มือถือใช้ปุ่มด้านล่าง)</p>
            <button onClick={() => setStatus("playing")} className="pixel-btn bg-[#c84c0c] px-6 py-3 text-sm text-white sm:text-base">
              ▶ เริ่มด่าน
            </button>
          </div>
        )}

        {/* Game Over */}
        {status === "gameover" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/85 p-4 text-center">
            <p className="font-pixel blink text-lg text-red-500 sm:text-2xl">GAME OVER</p>
            <p className="text-sm text-white/85">หัวใจหมดแล้ว! ตอบถูก {correct} ข้อ · ผิด {wrong} ข้อ · เก็บได้ {coins} เหรียญ</p>
            <div className="flex gap-2">
              <button onClick={restart} className="pixel-btn bg-[#fbd000] px-4 py-2 text-sm text-[#0b0620]">
                🔁 เล่นใหม่
              </button>
              <a href={`/chapter/${chapter.id}/study`} className="pixel-btn bg-sky-600 px-4 py-2 text-sm text-white">
                📖 กลับไปทบทวนบทเรียน
              </a>
            </div>
          </div>
        )}

        {/* ชนะด่าน */}
        {status === "win" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 p-4 text-center">
            <Confetti />
            <p className="font-pixel text-base text-[#fbd000] sm:text-xl">STAGE CLEAR!</p>
            <p className="text-lg font-bold text-white">🚩 พิชิตด่าน “{chapter.title}” สำเร็จ!</p>
            <p className="text-sm text-white/85">
              🏅 ได้รับ Badge: ผู้พิชิต{chapter.title} · คะแนนรวม {score} · เหรียญ {coins} · ตอบถูก {correct}/{correct + wrong}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <button onClick={restart} className="pixel-btn bg-[#00a800] px-4 py-2 text-sm text-white">
                🔁 เล่นอีกครั้ง
              </button>
              <a href={`/chapter/${chapter.id}/minigame`} className="pixel-btn bg-fuchsia-600 px-4 py-2 text-sm text-white">
                🕹️ เล่นมินิเกมประจำบท
              </a>
              <a href={`/chapter/${chapter.id}/boss`} className="pixel-btn bg-red-700 px-4 py-2 text-sm text-white">
                👹 ท้าบอสท้ายบท
              </a>
            </div>
          </div>
        )}

        {/* ร้านค้าไอเทม */}
        {shop && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/75 p-3">
            <div className="pixel-box pop-in w-full max-w-md bg-[#1b1140] p-4">
              <p className="mb-1 font-pixel text-xs text-[#fbd000]">🏪 ร้านไอเทม TOAD SHOP</p>
              <p className="mb-3 text-xs text-white/70">มีเหรียญอยู่ 🪙 {coins} — ซื้อไอเทมช่วยเล่นด่านได้เลย</p>
              <div className="grid gap-2">
                <button onClick={() => buy("heart")} className="pixel-btn flex items-center gap-2 bg-[#c84c0c] px-3 py-2 text-left text-xs text-white">
                  🍄 เห็ดฮีลเลือด (+1 หัวใจ) <span className="ml-auto font-pixel text-[10px]">30 🪙</span>
                </button>
                <button onClick={() => buy("shield")} className="pixel-btn flex items-center gap-2 bg-sky-700 px-3 py-2 text-left text-xs text-white">
                  🛡️ โล่กันผิด (รับความเสียหายแทน 1 ครั้ง) <span className="ml-auto font-pixel text-[10px]">40 🪙</span>
                </button>
                <button onClick={() => buy("hint")} className="pixel-btn flex items-center gap-2 bg-fuchsia-700 px-3 py-2 text-left text-xs text-white">
                  ✂️ กรรไกรตัด 2 ช้อยส์ <span className="ml-auto font-pixel text-[10px]">20 🪙</span>
                </button>
                <button onClick={() => buy("star")} className="pixel-btn flex items-center gap-2 bg-yellow-500 px-3 py-2 text-left text-xs text-[#0b0620]">
                  ⭐ ดาวพลัง ×2 (เหรียญ 2 เท่า 45 วิ) <span className="ml-auto font-pixel text-[10px]">50 🪙</span>
                </button>
              </div>
              <button
                onClick={() => {
                  setShop(false);
                  pendingTileRef.current = null;
                  pausedRef.current = false;
                }}
                className="pixel-btn mt-3 w-full bg-[#2a1a4a] px-3 py-2 text-xs text-white"
              >
                ▶ ออกจากร้าน เล่นต่อ
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ปุ่มควบคุมสำหรับจอมือถือ */}
      <div className="mt-2 grid grid-cols-3 gap-2 select-none sm:hidden">
        <button
          className="pixel-btn bg-[#2a1a4a] py-5 text-2xl text-white active:bg-[#fbd000]"
          onPointerDown={() => (keysRef.current.left = true)}
          onPointerUp={() => (keysRef.current.left = false)}
          onPointerLeave={() => (keysRef.current.left = false)}
        >
          ◀
        </button>
        <button
          className="pixel-btn bg-[#c84c0c] py-5 text-2xl text-white active:bg-[#fbd000]"
          onPointerDown={() => (keysRef.current.jump = true)}
          onPointerUp={() => (keysRef.current.jump = false)}
          onPointerLeave={() => (keysRef.current.jump = false)}
        >
          ▲
        </button>
        <button
          className="pixel-btn bg-[#2a1a4a] py-5 text-2xl text-white active:bg-[#fbd000]"
          onPointerDown={() => (keysRef.current.right = true)}
          onPointerUp={() => (keysRef.current.right = false)}
          onPointerLeave={() => (keysRef.current.right = false)}
        >
          ▶
        </button>
      </div>
      <p className="mt-2 hidden text-center text-[11px] text-white/50 sm:block">
        ใช้ปุ่ม ← → เพื่อเดิน · ↑ / Space เพื่อกระโดด · ชนบล็อก ? เพื่อทำโจทย์ · เห็ด 🍄 ฮีลเลือด · ร้าน $ ซื้อไอเทม
      </p>

      {/* โมดัลโจทย์ */}
      <QuizModal
        question={quiz}
        open={!!quiz}
        title={`WORLD ${chapter.id.toUpperCase()}`}
        hintLeft={hint}
        allowRetry
        coinReward={star > 0 ? 20 : 10}
        onUseHint={() => {
          hintRef.current = Math.max(0, hintRef.current - 1);
          setHint(hintRef.current);
        }}
        onAnswer={handleAnswer}
        onClose={() => setQuiz(null)}
      />
    </div>
  );
}
