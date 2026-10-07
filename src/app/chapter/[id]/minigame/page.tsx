"use client";
// หน้ามินิเกมประจำบท (/chapter/[id]/minigame) — 18 มินิเกมไม่ซ้ำกัน
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { getChapter } from "@/data";
import MiniGame from "@/components/MiniGame";
import type { MiniGameResult } from "@/components/minigames/MiniGameFrame";
import { recordResult } from "@/lib/storage";
import { submitScore, useGameState } from "@/lib/useGameState";

export default function MiniGamePage() {
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

  const handleFinish = (r: MiniGameResult) => {
    update((s) => recordResult(s, chapter.id, { correct: r.correct, wrong: r.wrong, coins: r.coins, score: r.score, win: r.win, kind: "minigame" }));
    void submitScore({ name: state.name, chapterId: chapter.id, mode: "minigame", score: r.score, coins: r.coins, correct: r.correct, wrong: r.wrong });
  };

  return (
    <div>
      <header className="pixel-box mb-3 flex flex-wrap items-center gap-2 bg-[#1b1140] p-3">
        <span className="text-3xl">🕹️</span>
        <div>
          <p className="font-pixel text-[10px] text-white/60">MINI GAME STAGE</p>
          <h1 className="text-lg font-extrabold" style={{ color: chapter.color }}>
            {chapter.miniGame.title}
          </h1>
          <p className="text-xs text-white/70">บท: {chapter.title} · ม.{chapter.level.replace("m", "")} เล่ม {chapter.book}</p>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <Link href={`/chapter/${chapter.id}/study`} className="pixel-btn bg-sky-600 px-3 py-2 text-xs text-white">📖 เรียนก่อนเล่น</Link>
          <Link href={`/chapter/${chapter.id}/mode`} className="pixel-btn bg-[#2a1a4a] px-3 py-2 text-xs text-white">⚙️ โหมดอื่น</Link>
        </div>
      </header>

      <div className="pixel-box mb-3 bg-[#120a26] p-3 text-xs text-white/75">
        <b className="text-[#fbd000]">🎯 เป้าหมาย:</b> {chapter.miniGame.desc} · ทุกครั้งที่เล่น ระบบจะสุ่มโจทย์ใหม่เสมอ ·
        ทำภารกิจสำเร็จได้คะแนนและเหรียญ 🪙 · พลาด 3 ครั้ง = เกมจบ
      </div>

      <MiniGame
        key={runId}
        chapter={chapter}
        onFinish={handleFinish}
        onRestart={() => setRunId((v) => v + 1)}
        onExit={() => (window.location.href = `/chapter/${chapter.id}/mode`)}
        onNext={() => (window.location.href = `/chapter/${chapter.id}/quiz`)}
      />
    </div>
  );
}
