// ===== ศูนย์รวมข้อมูลบทเรียนทั้งหมด (อิงหลักสูตร สสวท. 2551 ปรับปรุง 2560 และ Project 14) =====

import type { Chapter, LevelId } from "@/lib/types";
import { M4L1 } from "./m4l1";
import { M4L2 } from "./m4l2";
import { M5L1 } from "./m5l1";
import { M5L2 } from "./m5l2";
import { M6L1 } from "./m6l1";
import { M6L2 } from "./m6l2";

export const ALL_CHAPTERS: Chapter[] = [...M4L1, ...M4L2, ...M5L1, ...M5L2, ...M6L1, ...M6L2];

export interface LevelMeta {
  id: LevelId;
  label: string;
  desc: string;
  color: string;
  emoji: string;
}

export const LEVELS: LevelMeta[] = [
  { id: "m4", label: "มัธยมศึกษาปีที่ 4", desc: "เซต · ตรรกศาสตร์ · จำนวนจริง · ฟังก์ชัน · Expo/Log · เรขาคณิตวิเคราะห์", color: "bg-sky-400", emoji: "📘" },
  { id: "m5", label: "มัธยมศึกษาปีที่ 5", desc: "ตรีโกณมิติ · เมทริกซ์ · เวกเตอร์ · จำนวนเชิงซ้อน · หลักการนับ · ความน่าจะเป็น", color: "bg-emerald-400", emoji: "📗" },
  { id: "m6", label: "มัธยมศึกษาปีที่ 6", desc: "ลำดับและอนุกรม · แคลคูลัส · สถิติศาสตร์ · ข้อมูล · ตัวแปรสุ่ม", color: "bg-amber-400", emoji: "📙" },
];

/** บททั้งหมดของชั้นและเล่มที่กำหนด */
export function chaptersOf(level: LevelId, book: 1 | 2): Chapter[] {
  return ALL_CHAPTERS.filter((c) => c.grade === `ม.${level.slice(1)}` && c.book === book);
}

/** ค้นหาบทจาก id */
export function getChapter(id: string): Chapter | undefined {
  return ALL_CHAPTERS.find((c) => c.id === id);
}

/** แปลง id ของ badge เป็นชื่ออ่านง่าย */
export function badgeInfo(badgeId: string): { label: string; emoji: string } {
  const prefix = badgeId.split(":")[0];
  const chId = badgeId.split(":")[1] ?? "";
  const ch = getChapter(chId);
  const name = ch ? ch.short : chId;
  switch (prefix) {
    case "game":
      return { label: `ผู้พิชิต${name}`, emoji: "🏁" };
    case "mini":
      return { label: `จ้าว${name}`, emoji: "🕹️" };
    case "boss":
      return { label: `ผู้ปราบบอส${name}`, emoji: "⚔️" };
    case "quiz":
      return { label: `มือแม่น${name}`, emoji: "🎯" };
    default:
      return { label: badgeId, emoji: "🏅" };
  }
}
