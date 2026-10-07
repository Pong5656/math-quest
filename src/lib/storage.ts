// ระบบบันทึกความคืบหน้าของผู้เล่นทั้งหมดด้วย localStorage
// (เหรียญ / คะแนน / Badge / Streak / สมุดจดข้อผิด / สถิติรายบท)
export interface Badge {
  id: string;
  name: string;
  chapterId: string;
  at: number;
}
export interface NotebookItem {
  qid: string;
  chapterId: string;
  wrong: number; // จำนวนครั้งที่ตอบผิด
  right: number; // จำนวนครั้งที่ทบทวนแล้วตอบถูก
  box: number; // กล่อง spaced repetition (0..4)
  next: number; // เวลาที่ควรทบทวนครั้งถัดไป
  at: number;
}
export interface ChapterStat {
  played: number;
  win: number;
  correct: number;
  wrong: number;
  bestScore: number;
  miniGameBest: number;
  quizBest: number;
  bossBest: number;
}
export interface GameState {
  coins: number;
  score: number;
  badges: Badge[];
  streak: number;
  bestStreak: number;
  lastPlayDay: string;
  notebook: NotebookItem[];
  chapters: Record<string, ChapterStat>;
  cleared: string[]; // id บทที่ผ่านด่านมาริโอแล้ว
  soundOn: boolean;
  name: string;
}

const KEY = "mq_state_v1";

export const emptyState: GameState = {
  coins: 0,
  score: 0,
  badges: [],
  streak: 0,
  bestStreak: 0,
  lastPlayDay: "",
  notebook: [],
  chapters: {},
  cleared: [],
  soundOn: true,
  name: "นักเรียน",
};

export function loadState(): GameState {
  if (typeof window === "undefined") return emptyState;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyState;
    return { ...emptyState, ...(JSON.parse(raw) as GameState) };
  } catch {
    return emptyState;
  }
}
export function saveState(s: GameState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* เพิกเฉยเมื่อ storage เต็ม */
  }
}

const dayKey = () => new Date().toISOString().slice(0, 10);

/** อัปเดต streak รายวัน (เล่นวันติดกัน +1) */
export function bumpStreak(s: GameState): GameState {
  const today = dayKey();
  if (s.lastPlayDay === today) return s;
  const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const streak = s.lastPlayDay === y ? s.streak + 1 : 1;
  return { ...s, streak, bestStreak: Math.max(s.bestStreak, streak), lastPlayDay: today };
}

export function chapterStat(s: GameState, id: string): ChapterStat {
  return s.chapters[id] ?? { played: 0, win: 0, correct: 0, wrong: 0, bestScore: 0, miniGameBest: 0, quizBest: 0, bossBest: 0 };
}

/** บันทึกผลการเล่นหนึ่งครั้ง */
export function recordResult(
  s: GameState,
  chapterId: string,
  r: { correct: number; wrong: number; coins: number; score: number; win?: boolean; badgeName?: string; kind?: "game" | "minigame" | "quiz" | "boss" },
): GameState {
  let n = bumpStreak(s);
  const cs = chapterStat(n, chapterId);
  const next: ChapterStat = {
    played: cs.played + 1,
    win: cs.win + (r.win ? 1 : 0),
    correct: cs.correct + r.correct,
    wrong: cs.wrong + r.wrong,
    bestScore: Math.max(cs.bestScore, r.score),
    miniGameBest: r.kind === "minigame" ? Math.max(cs.miniGameBest, r.score) : cs.miniGameBest,
    quizBest: r.kind === "quiz" ? Math.max(cs.quizBest, r.score) : cs.quizBest,
    bossBest: r.kind === "boss" ? Math.max(cs.bossBest, r.score) : cs.bossBest,
  };
  const badges = [...n.badges];
  if (r.win && r.badgeName && !badges.some((b) => b.id === `${chapterId}:${r.badgeName}`)) {
    badges.push({ id: `${chapterId}:${r.badgeName}`, name: r.badgeName, chapterId, at: Date.now() });
  }
  return {
    ...n,
    coins: n.coins + r.coins,
    score: n.score + r.score,
    badges,
    cleared: r.win && !n.cleared.includes(chapterId) ? [...n.cleared, chapterId] : n.cleared,
    chapters: { ...n.chapters, [chapterId]: next },
  };
}

/** เพิ่มข้อที่ตอบผิดลงสมุดจดข้อผิด (spaced repetition แบบง่าย: 1 วัน / 3 วัน / 7 วัน / 14 วัน) */
export function addWrong(s: GameState, qid: string, chapterId: string): GameState {
  const gaps = [0, 86400000, 3 * 86400000, 7 * 86400000, 14 * 86400000];
  const list = [...s.notebook];
  const i = list.findIndex((x) => x.qid === qid);
  if (i >= 0) {
    const it = list[i];
    list[i] = { ...it, wrong: it.wrong + 1, box: 0, next: Date.now(), at: Date.now() };
  } else {
    list.push({ qid, chapterId, wrong: 1, right: 0, box: 0, next: Date.now(), at: Date.now() });
  }
  return { ...bumpStreak(s), notebook: list };
}

/** ทบทวนถูก → เลื่อนกล่อง spaced repetition */
export function markReviewed(s: GameState, qid: string, ok: boolean): GameState {
  const gaps = [86400000, 3 * 86400000, 7 * 86400000, 14 * 86400000, 30 * 86400000];
  const list = s.notebook.map((it) => {
    if (it.qid !== qid) return it;
    const box = ok ? Math.min(4, it.box + 1) : 0;
    return { ...it, box, right: it.right + (ok ? 1 : 0), next: Date.now() + gaps[box] };
  });
  return { ...s, notebook: ok ? list.filter((x) => x.qid !== qid || x.box < 4) : list };
}
