"use client";
// FormulaCard — การ์ดสูตรในคลังสูตร: สมการ KaTeX + วิธีจำ + พิสูจน์ย่อ + ตัวอย่าง
import { motion } from "framer-motion";
import MathText, { MathBlock } from "@/lib/math";

export interface FormulaCardData {
  id: string;
  name: string;
  tex: string;
  memory: string;
  proof: string;
  example: string;
  chapterId: string;
  chapterTitle: string;
  level: string;
  book: number;
  color: string;
}

export default function FormulaCard({ f, index }: { f: FormulaCardData; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(index * 0.04, 0.4), duration: 0.4 }}
      className="pixel-box flex flex-col bg-[#1b1140] p-4"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="pixel-btn px-2 py-1 font-pixel text-[9px] text-[#0b0620]" style={{ background: f.color }}>
          ม.{f.level.replace("m", "")} เล่ม{f.book}
        </span>
        <span className="text-[11px] text-white/60">{f.chapterTitle}</span>
      </div>

      <h3 className="mb-2 text-base font-extrabold text-[#fbd000]">📐 {f.name}</h3>

      <div className="mb-3 border-4 border-[#0b0620] bg-white px-3 py-2 text-[#1a1030]">
        <MathBlock tex={f.tex} />
      </div>

      <div className="mb-2 border-l-4 border-green-500 bg-green-900/25 px-2 py-1.5 text-sm text-green-100">
        🧠 <b>วิธีจำ:</b> <MathText>{f.memory}</MathText>
      </div>
      <div className="mb-2 border-l-4 border-sky-500 bg-sky-900/25 px-2 py-1.5 text-sm text-sky-100">
        🔍 <b>พิสูจน์ย่อ:</b> <MathText>{f.proof}</MathText>
      </div>
      <div className="mt-auto border-l-4 border-[#fbd000] bg-yellow-900/25 px-2 py-1.5 text-sm text-yellow-100">
        ✏️ <b>ตัวอย่าง:</b> <MathText>{f.example}</MathText>
      </div>
    </motion.article>
  );
}
