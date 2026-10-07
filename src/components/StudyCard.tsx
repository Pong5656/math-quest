"use client";
// StudyCard — การ์ดสเต็ปการสอน "จับมือทำ" แต่ละสเต็ปพื้นหลังคนละโทนสี + fade-in เมื่อเลื่อนถึง
import { motion } from "framer-motion";
import type { StudyStep } from "@/lib/types";
import MathText, { MathBlock } from "@/lib/math";
import RichText from "./RichText";

export default function StudyCard({ step, index, total }: { step: StudyStep; index: number; total: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 46 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, ease: [0.2, 0.9, 0.3, 1] }}
      className={`pixel-box relative overflow-hidden bg-gradient-to-br ${step.tone} p-4 text-[#12101f] sm:p-6`}
    >
      {/* หมายเลขสเต็ป */}
      <div className="absolute right-2 top-2 font-pixel text-[10px] text-[#0b0620]/40">
        {index + 1}/{total}
      </div>

      <header className="mb-3 flex items-center gap-3">
        <motion.span
          animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 3 }}
          className="text-3xl sm:text-4xl"
        >
          {step.icon}
        </motion.span>
        <h3 className="font-pixel text-[11px] leading-relaxed text-[#0b0620] sm:text-sm">{step.title}</h3>
      </header>

      <ul className="space-y-2">
        {step.lines.map((line, i) => {
          // บรรทัดที่เป็นสมการล้วน (ขึ้นต้นด้วย \[) แสดงเป็นบล็อกกลางจอ
          if (line.trim().startsWith("\\[")) {
            return (
              <motion.li
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.05 * i }}
                className="border-4 border-[#0b0620]/25 bg-white/70 px-3 py-2"
              >
                <MathBlock tex={line.trim().slice(2, -2)} />
              </motion.li>
            );
          }
          return (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -22 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.06 * i, duration: 0.4 }}
              className="flex gap-2 text-[15px] leading-relaxed"
            >
              <span className="mt-2 h-2 w-2 shrink-0 bg-[#0b0620]/60" />
              <span>
                <RichText text={line} />
              </span>
            </motion.li>
          );
        })}
      </ul>

      {/* กล่องเน้นพิเศษ (สูตรสำคัญ / กฎที่ต้องท่อง) */}
      {step.box && (
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25 }}
          className="mt-4 border-4 border-[#0b0620] bg-[#fffbe6] p-3 shadow-[5px_5px_0_0_#0b062066]"
        >
          <p className="mb-2 font-pixel text-[10px] text-[#c84c0c]">⭐ {step.box.title}</p>
          <ul className="space-y-1.5">
            {step.box.lines.map((l, i) => (
              <li key={i} className="text-[15px] leading-relaxed">
                <MathText>{l}</MathText>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </motion.section>
  );
}
