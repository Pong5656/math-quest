"use client";

// ===== คอนเฟตติพิกเซล 8 บิต ตอนชนะด่าน =====

import { useMemo } from "react";

const COLORS = ["#facc15", "#ef4444", "#22c55e", "#3b82f6", "#f97316", "#ffffff", "#a855f7"];

export default function Confetti({ count = 70 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 1.2,
        dur: 2.2 + Math.random() * 2,
        color: COLORS[i % COLORS.length],
        size: 6 + Math.floor(Math.random() * 3) * 3,
      })),
    [count]
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-[80] overflow-hidden">
      <style>{`@keyframes mq-fall { 0% { transform: translateY(-8vh) rotate(0deg);} 100% { transform: translateY(108vh) rotate(540deg);} }`}</style>
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 block"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            animation: `mq-fall ${p.dur}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
