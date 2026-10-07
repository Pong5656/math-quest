"use client";
// หน้าเล่นเกมมาริโอประจำบท (/chapter/[id]/play)
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { getChapter } from "@/data";
import GameCanvas, { type GameResult } from "@/components/GameCanvas";
import { recordResult } from "@/lib/storage";
import { submitScore, useGameState } from "@/lib/useGameState";

export default function PlayPage() {
  const params = useParams<{ id: string }>();
  const chapter = getChapter(params.id ?? "");
  const { update, state } = useGameState();
  const [runId, setRunId] = useState(0);

  if (!chapter) {
    return (
      <div className="pixel-box bg-[#1b1140] p-6 text-center">
        <p className="font-pixel text-sm text-red-400">404 — ไม่พบบทเรียนนี้</p>
        <Link href="/select" className="pixel-btn mt-4 inline-block bg-[#fbd000] px-4 py-2 text-sm text-[#0b0620]">◀ กลับ</Link>
      </div>
    );
  }

  const handleFinish = (r: GameResult) => {
    // บันทึกผลลง localStorage (เหรียญ คะแนน Badge Streak) และส่งขึ้นเซิร์ฟเวอร์
    update((s) =>
      recordResult(s, chapter.id, {
        correct: r.correct,
        wrong: r.wrong,
        coins: r.coins,
        score: r.score,
        win: r.win,
        badgeName: r.badgeName,
        kind: "game",
      }),
    );
    void submitScore({ name: state.name, chapterId: chapter.id, mode: "game", score: r.score, coins: r.coins, correct: r.correct, wrong: r.wrong });
  };

  return (
    <div>
      <header className="pixel-box mb-3 flex flex-wrap items-center gap-2 bg-[#1b1140] p-3">
        <span className="text-3xl">{chapter.emoji}</span>
        <div>
          <p className="font-pixel text-[10px] text-white/60">SUPER MATH BROS · WORLD {chapter.id.toUpperCase()}</p>
          <h1 className="text-lg font-extrabold" style={{ color: chapter.color }}>
            ด่านมาริโอ: {chapter.title}
          </h1>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <Link href={`/chapter/${chapter.id}/study`} className="pixel-btn bg-sky-600 px-3 py-2 text-xs text-white">📖 ทบทวนบทเรียน</Link>
          <Link href={`/chapter/${chapter.id}/minigame`} className="pixel-btn bg-fuchsia-600 px-3 py-2 text-xs text-white">🕹️ มินิเกม</Link>
          <Link href={`/chapter/${chapter.id}/mode`} className="pixel-btn bg-[#2a1a4a] px-3 py-2 text-xs text-white">⚙️ โหมด</Link>
        </div>
      </header>

      <GameCanvas key={runId} chapter={chapter} onFinish={handleFinish} />

      <div className="pixel-box mt-3 bg-[#120a26] p-3 text-xs text-white/70">
        <p className="mb-1 font-pixel text-[10px] text-[#fbd000]">🎮 เคล็ดลับการเล่นด่านนี้</p>
        <ul className="grid gap-1 sm:grid-cols-2">
          <li>🟢 โซนต้นด่าน = โจทย์ระดับง่าย 🟡 กลางด่าน = ประยุกต์ 🔴 ท้ายด่าน = ยากแนว A-Level</li>
          <li>🍄 เห็ดบนพื้นช่วยฮีลเลือด (หัวใจสูงสุด 5 ดวง) — เก็บไว้ก่อนเจอบอส</li>
          <li>🏪 ร้านค้า "$" ใช้เหรียญซื้อ: เห็ดฮีล 30 · โล่กันผิด 40 · กรรไกรตัดช้อยส์ 20 · ดาว ×2 50</li>
          <li>💔 ตอบผิดเสียหัวใจ 1 ดวง แต่ระบบจะเฉลยทีละขั้น + ทริก แล้วให้ "ลองตอบใหม่" ได้</li>
          <li>👾 เหยียบสไลม์โจทย์จากด้านบนเพื่อเก็บเหรียญ (โดนด้านข้างเสียหัวใจ)</li>
          <li>🚩 ไปให้ถึงธงชัยท้ายด่านเพื่อรับ Badge "ผู้พิชิต{chapter.title}"</li>
        </ul>
        <button onClick={() => setRunId((v) => v + 1)} className="pixel-btn mt-2 bg-[#c84c0c] px-3 py-2 text-xs text-white">
          🔁 เริ่มด่านใหม่ตั้งแต่ต้น
        </button>
      </div>
    </div>
  );
}
