"use client";
// ══════════════════════════════════════════════════════════
// สมุดจดข้อผิด (/notebook) — ข้อที่เคยตอบผิดจากทุกโหมด + ทบทวนซ้ำแบบ spaced repetition
// ══════════════════════════════════════════════════════════
import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { DIFF_META, findQuestion } from "@/data";
import MathText from "@/lib/math";
import QuizModal from "@/components/QuizModal";
import { markReviewed, type NotebookItem } from "@/lib/storage";
import { useGameState } from "@/lib/useGameState";
import { sfx } from "@/lib/sound";
import type { Question } from "@/lib/types";

const BOX_LABEL = ["ทบทวนวันนี้", "ทบทวนใน 1 วัน", "ทบทวนใน 3 วัน", "ทบทวนใน 7 วัน", "ทบทวนใน 14 วัน"];

export default function NotebookPage() {
  const { state, ready, update } = useGameState();
  const [onlyDue, setOnlyDue] = useState(false);
  const [openQ, setOpenQ] = useState<Question | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const items = useMemo(() => {
    const now = Date.now();
    return state.notebook
      .filter((it) => (onlyDue ? it.next <= now : true))
      .filter((it) => (filter === "all" ? true : it.chapterId.startsWith(filter)))
      .sort((a, b) => a.next - b.next);
  }, [state.notebook, onlyDue, filter]);

  const dueCount = state.notebook.filter((i) => i.next <= Date.now()).length;

  const onAnswer = (ok: boolean) => {
    if (!openQ) return;
    const qid = openQ.id;
    update((s) => markReviewed(s, qid, ok));
    ok ? sfx.correct() : sfx.wrong();
    setOpenQ(null);
  };

  return (
    <div className="space-y-4">
      <header className="pixel-box bg-gradient-to-r from-sky-700 to-[#1b1140] p-4">
        <h1 className="font-pixel text-sm text-[#fbd000] sm:text-base">📓 NOTEBOOK — สมุดจดข้อผิด</h1>
        <p className="mt-1 text-sm text-white/85">
          ข้อที่คุณเคยตอบผิดจากระหว่างเล่นด่าน / มินิเกม / แบบทดสอบ / บอส จะถูกเก็บไว้อัตโนมัติที่นี่ ทบทวนซ้ำจนกว่าจะแม่น
        </p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <span className="pixel-box bg-black/30 px-2 py-1">ทั้งหมด {state.notebook.length} ข้อ</span>
          <span className="pixel-box bg-black/30 px-2 py-1 text-[#fbd000]">ถึงกำหนดทบทวน {ready ? dueCount : 0} ข้อ</span>
        </div>
      </header>

      <div className="pixel-box flex flex-wrap items-center gap-2 bg-[#120a26] p-3">
        <button onClick={() => setOnlyDue((v) => !v)} className={`pixel-btn px-3 py-2 text-xs ${onlyDue ? "bg-[#fbd000] text-[#0b0620]" : "bg-[#2a1a4a] text-white"}`}>
          ⏰ เฉพาะที่ถึงกำหนดทบทวน
        </button>
        <span className="text-xs text-white/60">กรองตามชั้น:</span>
        {["all", "m4", "m5", "m6"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`pixel-btn px-3 py-1.5 text-xs ${filter === f ? "bg-[#00a800] text-white" : "bg-[#2a1a4a] text-white"}`}>
            {f === "all" ? "ทั้งหมด" : `ม.${f.replace("m", "")}`}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="pixel-box bg-[#120a26] p-10 text-center">
          <p className="text-5xl">{state.notebook.length === 0 ? "🎉" : "✅"}</p>
          <p className="mt-3 text-sm text-white/85">
            {state.notebook.length === 0 ? "ยังไม่เคยตอบผิดเลย! ไปลุยด่านเก็บเหรียญกันเลย 🍄" : "ไม่มีข้อที่ถึงกำหนดทบทวนตอนนี้ — เยี่ยมมาก!"}
          </p>
          <Link href="/select" className="pixel-btn mt-4 inline-block bg-[#fbd000] px-4 py-2 text-sm text-[#0b0620]">
            ▶ เริ่มผจญภัย
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((it: NotebookItem, i: number) => {
            const found = findQuestion(it.qid);
            if (!found) return null;
            const { chapter, question } = found;
            const due = it.next <= Date.now();
            return (
              <motion.article
                key={it.qid}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                className="pixel-box bg-[#1b1140] p-3"
              >
                <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className={`pixel-btn px-2 py-0.5 text-white ${DIFF_META[question.diff].bg}`}>
                    {DIFF_META[question.diff].dot} {DIFF_META[question.diff].label}
                  </span>
                  <span className="border-2 border-white/20 px-1.5 py-0.5 text-white/70">
                    {chapter.emoji} {chapter.title}
                  </span>
                  <span className="border-2 border-red-500/50 px-1.5 py-0.5 text-red-300">ผิด {it.wrong} ครั้ง</span>
                  {it.right > 0 && <span className="border-2 border-green-500/50 px-1.5 py-0.5 text-green-300">ทบทวนถูก {it.right}</span>}
                  <span className={`ml-auto px-1.5 py-0.5 ${due ? "blink bg-[#fbd000] text-[#0b0620]" : "text-white/50"}`}>
                    {due ? "⏰ ถึงกำหนดแล้ว" : BOX_LABEL[Math.min(it.box, 4)]}
                  </span>
                </div>

                <p className="mb-2 border-4 border-[#0b0620] bg-white px-2 py-1.5 text-sm text-[#1a1030]">
                  <MathText>{question.q}</MathText>
                </p>

                <details className="mb-2 text-xs text-white/75">
                  <summary className="cursor-pointer font-bold text-[#fbd000]">👀 ดูเฉลยทีละขั้น + ทริก</summary>
                  <div className="mt-2 space-y-1 border-l-4 border-white/20 pl-2">
                    <p className="text-green-300">
                      คำตอบ: <MathText>{question.options[question.answer]}</MathText>
                    </p>
                    {question.steps.map((s, k) => (
                      <p key={k}>
                        <b className="text-[#fbd000]">ขั้น {k + 1}:</b> <MathText>{s}</MathText>
                      </p>
                    ))}
                    <p className="text-emerald-300">💡 ทริก: <MathText>{question.trick}</MathText></p>
                    <p className="text-yellow-200">📏 สูตร: <MathText>{question.formula}</MathText></p>
                  </div>
                </details>

                <div className="flex gap-2">
                  <button onClick={() => setOpenQ(question)} className="pixel-btn flex-1 bg-[#00a800] px-3 py-2 text-xs text-white">
                    🔁 ทบทวนโดยทำโจทย์อีกครั้ง
                  </button>
                  <Link href={`/chapter/${chapter.id}/study`} className="pixel-btn bg-[#2a1a4a] px-3 py-2 text-xs text-white">
                    📖 อ่านบทนี้
                  </Link>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      <QuizModal question={openQ} open={!!openQ} title="ทบทวนจากสมุดจดข้อผิด" allowRetry={false} coinReward={5} onAnswer={onAnswer} onClose={() => setOpenQ(null)} />
    </div>
  );
}
