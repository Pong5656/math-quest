// ชนิดข้อมูลหลักของ MATH QUEST (คำอธิบายภาษาไทยทั้งหมด)

/** ระดับความยากของโจทย์ 🟢 ง่าย 🟡 กลาง 🔴 ยาก */
export type Difficulty = "easy" | "medium" | "hard";

/** โจทย์ปรนัย 4 ตัวเลือก พร้อมเฉลยทีละขั้น + ทริก + สูตรที่ใช้ */
export interface Question {
  id: string;
  diff: Difficulty;
  /** เนื้อโจทย์ (รองรับ \( \) และ \[ \] สำหรับ KaTeX) */
  q: string;
  options: string[];
  /** ดัชนีคำตอบที่ถูกต้อง (0-3) */
  answer: number;
  /** วิธีทำทีละขั้น */
  steps: string[];
  /** ทริกคิดลัด */
  trick: string;
  /** สูตรที่ใช้ (LaTeX) */
  formula: string;
  topic?: string;
}

/** การ์ดสเต็ปการสอนในหน้า /study */
export interface StudyStep {
  key: string; // step0..step5
  icon: string;
  title: string;
  tone: string; // คลาสสีพื้นหลังของการ์ด
  lines: string[]; // เนื้อหาแต่ละบรรทัด
  box?: { title: string; lines: string[] }; // กล่องเน้น (สูตร / ทริก / จุดพลาด)
}

/** การ์ดสูตรในคลังสูตร */
export interface Formula {
  id: string;
  name: string;
  tex: string; // สมการ KaTeX
  memory: string; // วิธีจำ (mnemonic)
  proof: string; // พิสูจน์ย่อ
  example: string; // ตัวอย่าง 1 ข้อ
}

/** มินิเกมประจำบท */
export interface MiniGameInfo {
  kind: string; // ชื่อชนิดมินิเกม (ไม่ซ้ำกันแต่ละบท)
  title: string;
  desc: string;
}

/** 1 บทเรียน */
export interface Chapter {
  id: string; // เช่น m4l1c1
  level: "m4" | "m5" | "m6";
  book: 1 | 2;
  no: number;
  title: string;
  subtitle: string;
  color: string; // สีประจำบท
  emoji: string;
  objectives: string[]; // จุดประสงค์การเรียนรู้ตาม สสวท.
  study: StudyStep[];
  formulas: Formula[];
  questions: Question[];
  miniGame: MiniGameInfo;
  bossName: string; // ชื่อบอสท้ายบท
  bossIntro: string;
}

/** ระดับชั้น */
export interface LevelInfo {
  id: "m4" | "m5" | "m6";
  name: string;
  color: string;
  emoji: string;
  desc: string;
}
