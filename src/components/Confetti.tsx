"use client";
// Confetti — โปรยกระดาษสีสไตล์ 8-Bit เมื่อชนะด่าน
import { motion } from "framer-motion";
import { useMemo } from "react";

const COLORS = ["#fbd000", "#c84c0c", "#00a800", "#5c94fc", "#ff2fb3", "#ffffff"];

export default function Confetti({ count = 90, show = true }: { count?: number; show?: boolean }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        dur: 1.8 + Math.random() * 1.8,
        size: 6 + Math.floor(Math.random() * 4) * 2,
        color: COLORS[i % COLORS.length],
        spin: Math.random() * 720 - 360,
      })),
    [count],
  );
  if (!show) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[200] overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ y: -40, x: 0, opacity: 1, rotate: 0 }}
          animate={{ y: "110vh", x: [0, p.spin / 12, 0], rotate: p.spin, opacity: [1, 1, 0.2] }}
          transition={{ duration: p.dur, delay: p.delay, ease: "linear" }}
          style={{ position: "absolute", left: `${p.left}%`, width: p.size, height: p.size, background: p.color, border: "1px solid #0b0620" }}
        />
      ))}
    </div>
  );
}
