"use client";
// useGameState — ฮุกอ่าน/เขียนสถานะผู้เล่น (เหรียญ คะแนน Badge Streak สมุดข้อผิด)
import { useCallback, useEffect, useState } from "react";
import { emptyState, loadState, saveState, type GameState } from "./storage";

export function useGameState() {
  const [state, setState] = useState<GameState>(emptyState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(loadState());
    setReady(true);
  }, []);

  const update = useCallback((fn: (s: GameState) => GameState) => {
    setState((prev) => {
      const next = fn(prev);
      saveState(next);
      if (typeof window !== "undefined") window.dispatchEvent(new Event("mq:update"));
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    saveState(emptyState);
    setState(emptyState);
    if (typeof window !== "undefined") window.dispatchEvent(new Event("mq:update"));
  }, []);

  return { state, ready, update, reset };
}

/** ส่งคะแนนขึ้นเซิร์ฟเวอร์ (Leaderboard) แบบไม่บล็อก UI */
export async function submitScore(body: {
  name: string;
  chapterId: string;
  mode: string;
  score: number;
  coins: number;
  correct: number;
  wrong: number;
}) {
  try {
    await fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    /* ทำงานออฟไลน์ได้ ไม่มีปัญหากับการเล่น */
  }
}

export async function fetchLeaderboard(chapterId?: string) {
  try {
    const q = chapterId ? `?chapterId=${chapterId}` : "";
    const res = await fetch(`/api/scores${q}`, { cache: "no-store" });
    const data = (await res.json()) as { ok: boolean; rows: Array<Record<string, unknown>> };
    return data.rows ?? [];
  } catch {
    return [];
  }
}
