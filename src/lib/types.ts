// ===== ชนิดข้อมูลหลักของ MATH QUEST =====

/** ระดับความยาก: 1 = 🟢 ง่าย, 2 = 🟡 กลาง, 3 = 🔴 ยาก (แนว A-Level) */
export type Diff = 1 | 2 | 3;

/** โจทย์ปรนัย 4 ตัวเลือก */
export interface Question {
  id: string;
  lv: Diff;
  q: string; // ใช้ $...$ ครอบสมการ KaTeX
  ch: string[]; // ตัวเลือก 4 ข้อ
  a: number; // index ของคำตอบที่ถูก
  steps: string[]; // วิธีทำทีละขั้น
  trick: string; // ทริกคิดลัด
  formula: string; // สูตรที่ใช้
}

/** การ์ดสเต็ปในหน้าเรียน */
export interface StudyStep {
  no: number; // 0..5
  icon: string;
  title: string;
  color: string; // class พื้นหลังของการ์ด
  lines: string[]; // เนื้อหาแต่ละบรรทัด (รองรับ $...$)
}

/** สูตรในคลังสูตร */
export interface Formula {
  name: string;
  latex: string; // สมการ KaTeX (ไม่ต้องครอบ $)
  memory: string; // วิธีจำ (mnemonic)
  proof: string; // พิสูจน์ย่อ
  example: string; // ตัวอย่าง 1 ข้อ
  ans: string; // เฉลยตัวอย่าง
}

/** ตัวควบคุมของมินิเกมแต่ละรูปแบบ */
export type MiniControl =
  | { type: "choice"; options: string[]; answer: number }
  | { type: "multi"; options: string[]; answer: number[]; note?: string }
  | { type: "toggles"; labels: string[]; target: boolean[] }
  | { type: "sliders"; params: { key: string; label: string; min: number; max: number; step: number; target: number }[] }
  | { type: "input"; answer: number; tol?: number; unit?: string };

export interface MiniRound {
  title: string;
  prompt: string;
  control: MiniControl;
  explain: string; // อธิบายหลังตอบ
}

/** มินิเกมประจำบท */
export interface MiniGame {
  title: string;
  emoji: string;
  story: string;
  rounds: MiniRound[];
}

/** บทเรียน 1 บท */
export interface Chapter {
  id: string; // เช่น m4l1c1
  grade: "ม.4" | "ม.5" | "ม.6";
  book: 1 | 2;
  num: number;
  title: string;
  short: string; // ชื่อสั้น
  emoji: string;
  color: string; // สีธีมของบท (class tailwind)
  objectives: string[]; // จุดประสงค์ตาม สสวท.
  study: StudyStep[]; // สเต็ปสอน 6 ใบ
  formulas: Formula[];
  questions: Question[]; // เรียงจาก 🟢 🟡 🔴
  mini: MiniGame;
}

/** เลเวลที่เลือก (ม.4 / ม.5 / ม.6) */
export type LevelId = "m4" | "m5" | "m6";
