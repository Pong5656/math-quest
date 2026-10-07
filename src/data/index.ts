import type { Chapter, Difficulty, LevelInfo, Question } from "@/lib/types";
import { m4l1Chapters } from "./m4l1";
import { m4l2Chapters } from "./m4l2";
import { m5l1Chapters } from "./m5l1";
import { m5l2Chapters } from "./m5l2";
import { m6l1Chapters } from "./m6l1";
import { m6l2Chapters } from "./m6l2";

/** รายชื่อระดับชั้น */
export const LEVELS: LevelInfo[] = [
  { id: "m4", name: "มัธยมศึกษาปีที่ 4", color: "#fbd000", emoji: "🐣", desc: "เซต ตรรกศาสตร์ จำนวนจริง · ฟังก์ชัน เอกซ์โพ–ล็อก เรขาคณิตวิเคราะห์" },
  { id: "m5", name: "มัธยมศึกษาปีที่ 5", color: "#00e5ff", emoji: "🚀", desc: "ตรีโกณมิติ เมทริกซ์ เวกเตอร์ · จำนวนเชิงซ้อน การนับ ความน่าจะเป็น" },
  { id: "m6", name: "มัธยมศึกษาปีที่ 6", color: "#7CFC00", emoji: "👑", desc: "ลำดับ–อนุกรม แคลคูลัส · สถิติศาสตร์และข้อมูล ตัวแปรสุ่ม" },
];

/** บทเรียนทั้งหมด 18 บท (ม.4–ม.6 เล่มละ 1–4 บท) */
export const CHAPTERS: Chapter[] = [
  ...m4l1Chapters,
  ...m4l2Chapters,
  ...m5l1Chapters,
  ...m5l2Chapters,
  ...m6l1Chapters,
  ...m6l2Chapters,
];

export const getChapter = (id: string): Chapter | undefined => CHAPTERS.find((c) => c.id === id);

export const getLevel = (id: string): LevelInfo | undefined => LEVELS.find((l) => l.id === id);

/** บทเรียนของชั้น/เล่มที่กำหนด */
export const chaptersOf = (level: string, book?: number): Chapter[] =>
  CHAPTERS.filter((c) => c.level === level && (book === undefined || c.book === book));

export const DIFF_META: Record<Difficulty, { label: string; dot: string; bg: string; desc: string }> = {
  easy: { label: "ง่าย", dot: "🟢", bg: "bg-green-600", desc: "เริ่มต้น เชื่อมโยงชีวิตจริง" },
  medium: { label: "กลาง", dot: "🟡", bg: "bg-yellow-500", desc: "ประยุกต์ 1 ขั้นตอน" },
  hard: { label: "ยาก", dot: "🔴", bg: "bg-red-600", desc: "ประยุกต์ 2–3 ขั้นตอน แนว A-Level" },
};

/** สุ่มโจทย์ตามระดับความยาก (ใช้ในเกมมาริโอ: โซนต้น=ง่าย กลาง=กลาง ท้าย=ยาก) */
export function pickQuestions(chapter: Chapter, diff?: Difficulty, count = 1): Question[] {
  let pool = chapter.questions;
  if (diff) pool = pool.filter((q) => q.diff === diff);
  if (pool.length === 0) pool = chapter.questions;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/** โจทย์สำหรับโหมดบอส (ยากทั้งหมด + สลับลำดับ) */
export const bossQuestions = (chapter: Chapter): Question[] => {
  const hard = chapter.questions.filter((q) => q.diff === "hard");
  const med = chapter.questions.filter((q) => q.diff === "medium");
  return [...hard, ...hard, ...med].sort(() => Math.random() - 0.5).slice(0, 8);
};

/** ค้นหาโจทย์จาก id (ใช้กับสมุดจดข้อผิด) */
export function findQuestion(qid: string): { chapter: Chapter; question: Question } | null {
  for (const ch of CHAPTERS) {
    const q = ch.questions.find((x) => x.id === qid);
    if (q) return { chapter: ch, question: q };
  }
  return null;
}

/** สูตรทั้งหมดสำหรับหน้าคลังสูตร */
export const ALL_FORMULAS = CHAPTERS.flatMap((c) =>
  c.formulas.map((f) => ({ ...f, chapterId: c.id, chapterTitle: c.title, level: c.level, book: c.book, color: c.color })),
);

export const totalQuestions = CHAPTERS.reduce((s, c) => s + c.questions.length, 0);
