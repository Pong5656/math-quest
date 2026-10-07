"use client";
// HeartBar — แถบหัวใจพร้อมอนิเมชันแตก/ซีดเมื่อเสียเลือด
import { motion, AnimatePresence } from "framer-motion";

export default function HeartBar({ hearts, max = 3, label = "ชีวิต" }: { hearts: number; max?: number; label?: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="font-pixel text-[9px] text-white/70">{label}</span>
      <div className="flex gap-1">
        <AnimatePresence initial={false}>
          {Array.from({ length: max }).map((_, i) => {
            const alive = i < hearts;
            return (
              <motion.span
                key={i}
                animate={alive ? { scale: 1, opacity: 1 } : { scale: 0.7, opacity: 0.25, rotate: -12 }}
                transition={{ type: "spring", stiffness: 400, damping: 12 }}
                className={`text-xl ${alive ? "" : "heart-lost grayscale"}`}
              >
                {alive ? "❤️" : "🖤"}
              </motion.span>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
