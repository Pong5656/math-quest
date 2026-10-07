"use client";
// ══════════════════════════════════════════════════════════
// คลังสูตร (/formulas) — ค้นหา + กรองตามชั้น/เล่ม/บท
// การ์ด = สูตร KaTeX + วิธีจำ (mnemonic) + พิสูจน์ย่อ + ตัวอย่าง 1 ข้อ
// ══════════════════════════════════════════════════════════
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ALL_FORMULAS, CHAPTERS, LEVELS } from "@/data";
import FormulaCard from "@/components/FormulaCard";
import MathText from "@/lib/math";

/** ตัดเครื่องหมาย LaTeX เพื่อใช้ค้นหาด้วยคำไทย/อังกฤษ */
const strip = (s: string) => s.replace(/\\[a-zA-Z]+|[{}\\^_$&]/g, " ").toLowerCase();

export default function FormulasPage() {
  const [q, setQ] = useState("");
  const [level, setLevel] = useState<string>("all");
  const [chapterId, setChapterId] = useState<string>("all");

  const list = useMemo(() => {
    const key = q.trim().toLowerCase();
    return ALL_FORMULAS.filter((f) => {
      if (level !== "all" && f.level !== level) return false;
      if (chapterId !== "all" && f.chapterId !== chapterId) return false;
      if (!key) return true;
      const hay = `${f.name} ${f.memory} ${f.proof} ${f.example} ${strip(f.tex)}`.toLowerCase();
      return key.split(/\s+/).every((w) => hay.includes(w));
    });
  }, [q, level, chapterId]);

  const chapters = chapterId !== "all" ? CHAPTERS.filter((c) => c.id === chapterId) : CHAPTERS.filter((c) => level === "all" || c.level === level);

  return (
    <div className="space-y-4">
      <header className="pixel-box bg-gradient-to-r from-yellow-600 to-[#1b1140] p-4">
        <h1 className="font-pixel text-sm text-[#fbd000] sm:text-base">📚 FORMULA LIBRARY</h1>
        <p className="mt-1 text-sm text-white/85">
          คลังสูตรคณิตศาสตร์เพิ่มเติม ม.4–ม.6 ทั้งหมด {ALL_FORMULAS.length} สูตร จาก {CHAPTERS.length} บท — พร้อมวิธีจำ พิสูจน์ย่อ และตัวอย่าง
        </p>
      </header>

      {/* ช่องค้นหา + ตัวกรอง */}
      <div className="pixel-box bg-[#120a26] p-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="🔍 ค้นหาสูตร เช่น ไซน์, อนุกรม, det, ลอการิทึม, Z, คราเมอร์..."
          className="mb-3 w-full border-4 border-[#0b0620] bg-white px-3 py-2.5 text-sm text-[#1a1030] outline-none placeholder:text-[#1a1030]/50 focus:border-[#fbd000]"
        />
        <div className="mb-2 flex flex-wrap gap-2">
          <span className="self-center text-xs text-white/60">กรองตามชั้น:</span>
          {["all", ...LEVELS.map((l) => l.id)].map((l) => (
            <button
              key={l}
              onClick={() => {
                setLevel(l);
                setChapterId("all");
              }}
              className={`pixel-btn px-3 py-1.5 text-xs ${level === l ? "bg-[#fbd000] text-[#0b0620]" : "bg-[#2a1a4a] text-white"}`}
            >
              {l === "all" ? "ทั้งหมด" : LEVELS.find((x) => x.id === l)?.name}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="self-center text-xs text-white/60">กรองตามบท:</span>
          <button onClick={() => setChapterId("all")} className={`pixel-btn px-3 py-1.5 text-xs ${chapterId === "all" ? "bg-[#00a800] text-white" : "bg-[#2a1a4a] text-white"}`}>
            ทุกบท
          </button>
          {chapters.map((c) => (
            <button
              key={c.id}
              onClick={() => setChapterId(c.id)}
              className={`pixel-btn px-3 py-1.5 text-xs ${chapterId === c.id ? "bg-[#00a800] text-white" : "bg-[#2a1a4a] text-white/85"}`}
            >
              {c.emoji} {c.title}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-white/60">
        พบ <b className="text-[#fbd000]">{list.length}</b> สูตร
        {q && (
          <>
            {" "}
            สำหรับการค้นหา “<MathText>{q}</MathText>”
          </>
        )}
      </p>

      <motion.div layout className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {list.map((f, i) => (
          <FormulaCard key={f.id} f={f} index={i} />
        ))}
      </motion.div>

      {list.length === 0 && (
        <div className="pixel-box bg-[#120a26] p-8 text-center">
          <p className="text-4xl">🔍</p>
          <p className="mt-2 text-sm text-white/80">ไม่พบสูตรที่ตรงกับคำค้น ลองใช้คำอื่น เช่น “ไซน์”, “ลิมิต”, “det”, “ความน่าจะเป็น”</p>
        </div>
      )}
    </div>
  );
}
