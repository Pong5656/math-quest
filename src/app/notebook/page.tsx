"use client";

// ===== สมุดจดข้อผิด: รวมข้อที่เคยตอบผิด พร้อมทบทวนแบบเว้นระยะ (spaced repetition อย่างง่าย) =====

import { useMemo, useRef, useState } from "react";
import type { Question } from "@/lib/types";
import { ALL_CHAPTERS, getChapter } from "@/data";
import { getSave, recordAnswer } from "@/lib/store";
import MathText from "@/components/MathText";
import QuizModal from "@/components/QuizModal";
import { DiffPill } from "@/components/ui";
import { sfx } from "@/lib/sfx";

interface Item {
  chId: string;
  q: Question;
  count: number;
  due: number;
}

export default function NotebookPage() {
  const [version, setVersion] = useState(0);
  const [reviewing, setReviewing] = useState<Item | null>(null);
  const wrongFirst = useRef(false);

  const items = useMemo(() => {
    void version;
    const save = getSave();
    const list: Item[] = [];
    for (const w of Object.values(save.wrong)) {
      const ch = getChapter(w.chId);
      const q = ch?.questions.find((x) => x.id === w.qid);
      if (ch && q) list.push({ chId: w.chId, q, count: w.count, due: w.due });
    }
    // เรียงตามจำนวนครั้งที่ผิดมากสุดก่อน (ข้อที่ผิดซ้ำ = ควรทบทวนก่อน)
    return list.sort((a, b) => b.count - a.count);
  }, [version]);

  const now = Date.now();
  const dueItems = items.filter((i) => i.due <= now);

  const closeReview = () => {
    setReviewing(null);
    wrongFirst.current = false;
    setVersion((v) => v + 1);
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-center font-pixel text-sm leading-6 text-[#23273a] sm:text-lg">📓 สมุดจดข้อผิด</h1>
      <p className="mt-2 text-center text-sm font-medium text-slate-700">
        ทุกข้อที่เคยตอบผิดจากเกม โหมดตะลุยโจทย์ และบอส จะถูกเก็บที่นี่ — ตอบถูกในการทบทวน = ลบออกจากสมุดอัตโนมัติ
      </p>

      {items.length > 0 ? (
        <div className="pixel-card mt-6 flex flex-wrap items-center gap-2 bg-[#fff8e7] p-3 text-sm font-bold">
          <span>📌 ทั้งหมด {items.length} ข้อ</span>
          <span className="text-red-700">⏰ ถึงกำหนดทบทวนแล้ว {dueItems.length} ข้อ</span>
          <span className="ml-auto text-xs text-slate-600">ผิดซ้ำบ่อยจะอยู่ด้านบนสุด</span>
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="pixel-card mx-auto mt-10 max-w-md bg-white p-8 text-center">
          <p className="text-5xl">🎉</p>
          <p className="mt-3 text-lg font-extrabold">สมุดว่างเปล่า!</p>
          <p className="mt-1 text-sm text-slate-600">ยังไม่มีข้อผิดพลาด — ไปลุยด่านเก็บเหรียญต่อกันเลย</p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {items.map((it) => {
            const ch = getChapter(it.chId)!;
            const overdue = it.due <= now;
            return (
              <div key={it.q.id} className={`pixel-card bg-white p-4 ${overdue ? "ring-4 ring-red-300" : ""}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xl">{ch.emoji}</span>
                  <span className="text-xs font-bold text-slate-500">{ch.grade} ล.{ch.book} · {ch.short}</span>
                  <DiffPill lv={it.q.lv} />
                  <span className="rounded-sm border-2 border-red-600 bg-red-100 px-2 py-0.5 text-xs font-extrabold text-red-700">ผิด {it.count} ครั้ง</span>
                  {overdue ? <span className="rounded-sm border-2 border-red-600 bg-red-500 px-2 py-0.5 text-xs font-extrabold text-white blink-slow">ถึงกำหนดทบทวน!</span> : null}
                </div>
                <p className="mt-2 text-sm font-semibold sm:text-base"><MathText text={it.q.q} /></p>
                <button
                  type="button"
                  onClick={() => {
                    sfx.click();
                    setReviewing(it);
                  }}
                  className="pixel-btn mt-3 rounded-sm bg-yellow-400 px-4 py-2 text-xs font-extrabold text-[#23273a]"
                >
                  ✍️ ทบทวนข้อนี้
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* โมดัลทบทวน */}
      {reviewing ? (
        <QuizModal
          q={reviewing.q}
          coinReward={0}
          allowRetry={false}
          onWrong={() => {
            wrongFirst.current = true;
            recordAnswer(reviewing.chId, reviewing.q.id, false);
          }}
          onCorrect={() => {
            if (!wrongFirst.current) {
              // ตอบถูก → ลบออกจากสมุด
              recordAnswer(reviewing.chId, reviewing.q.id, true);
              sfx.correct();
            }
            closeReview();
          }}
        />
      ) : null}
    </main>
  );
}
