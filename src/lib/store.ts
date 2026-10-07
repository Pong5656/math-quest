// ===== ระบบบันทึกข้อมูลผู้เล่น (localStorage) =====

export interface Stats {
  coins: number; // เหรียญรวม
  score: number; // คะแนนรวม
  streak: number; // วันที่เล่นติดต่อกัน
  lastPlay: string; // yyyy-mm-dd ล่าสุดที่เล่น
  badges: string[]; // id ของ badge ที่ได้
  answered: number; // จำนวนข้อที่ตอบทั้งหมด
  correct: number; // จำนวนข้อที่ถูก
}

export interface WrongEntry {
  chId: string; // บทของโจทย์
  qid: string;
  count: number; // จำนวนครั้งที่ตอบผิด
  last: number; // timestamp ล่าสุดที่ผิด
  due: number; // timestamp ที่ควรทบทวน (spaced repetition)
}

export interface Inv {
  mushroom: number; // เห็ดเพิ่มหัวใจ
  star: number; // ดาวป้องกันตอบผิด 1 ครั้ง
  hint: number; // ยาใบ้ ตัดตัวเลือกผิด 2 ข้อ
}

export interface DoneMap {
  [chId: string]: { game: boolean; mini: boolean; boss: boolean; quizBest: number };
}

export interface SaveData {
  stats: Stats;
  wrong: Record<string, WrongEntry>;
  inv: Inv;
  done: DoneMap;
}

const KEY = "mathquest_v1";

const DEFAULT_SAVE: SaveData = {
  stats: { coins: 0, score: 0, streak: 0, lastPlay: "", badges: [], answered: 0, correct: 0 },
  wrong: {},
  inv: { mushroom: 1, star: 0, hint: 1 },
  done: {},
};

function load(): SaveData {
  if (typeof window === "undefined") return structuredClone(DEFAULT_SAVE);
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT_SAVE);
    const data = JSON.parse(raw) as SaveData;
    return {
      stats: { ...DEFAULT_SAVE.stats, ...data.stats },
      wrong: data.wrong ?? {},
      inv: { ...DEFAULT_SAVE.inv, ...data.inv },
      done: data.done ?? {},
    };
  } catch {
    return structuredClone(DEFAULT_SAVE);
  }
}

function persist(s: SaveData) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(s));
}

/** อ่านข้อมูลทั้งหมด */
export function getSave(): SaveData {
  return load();
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** อัปเดต streak รายวัน — เรียกเมื่อเริ่มเล่น/เรียน */
export function bumpStreak(): SaveData {
  const s = load();
  const d = today();
  if (s.stats.lastPlay !== d) {
    const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    s.stats.streak = s.stats.lastPlay === y ? s.stats.streak + 1 : 1;
    s.stats.lastPlay = d;
    persist(s);
  }
  return s;
}

/** เพิ่ม/ลดเหรียญ */
export function addCoins(n: number): SaveData {
  const s = load();
  s.stats.coins = Math.max(0, s.stats.coins + n);
  persist(s);
  return s;
}

/** เพิ่มคะแนน */
export function addScore(n: number): SaveData {
  const s = load();
  s.stats.score += n;
  persist(s);
  return s;
}

/** บันทึกการตอบ (อัปเดตสมุดข้อผิดอัตโนมัติ) */
export function recordAnswer(chId: string, qid: string, correct: boolean): SaveData {
  const s = load();
  s.stats.answered += 1;
  if (correct) {
    s.stats.correct += 1;
    delete s.wrong[qid]; // ตอบถูกในโหมดทบทวน = เอาออกจากสมุด
  } else {
    const prev = s.wrong[qid];
    const now = Date.now();
    const count = (prev?.count ?? 0) + 1;
    // spaced repetition อย่างง่าย: ผิดบ่อย → เว้นทบทวนสั้นลง
    const gap = count <= 1 ? 86400000 : count === 2 ? 43200000 : 21600000;
    s.wrong[qid] = { chId, qid, count, last: now, due: prev ? prev.due : now + gap };
  }
  persist(s);
  return s;
}

/** หยิบไอเทมจากคลัง 1 ชิ้น (คืนค่าว่าสำเร็จไหม) */
export function useItem(item: keyof Inv): boolean {
  const s = load();
  if (s.inv[item] > 0) {
    s.inv[item] -= 1;
    persist(s);
    return true;
  }
  return false;
}

/** ซื้อไอเทมด้วยเหรียญ */
export function buyItem(item: keyof Inv, price: number): boolean {
  const s = load();
  if (s.stats.coins >= price) {
    s.stats.coins -= price;
    s.inv[item] += 1;
    persist(s);
    return true;
  }
  return false;
}

/** ปลดล็อก badge */
export function awardBadge(id: string): SaveData {
  const s = load();
  if (!s.stats.badges.includes(id)) s.stats.badges.push(id);
  persist(s);
  return s;
}

/** ระบุว่าผ่านโหมดต่าง ๆ ของบท */
export function markDone(chId: string, key: "game" | "mini" | "boss"): SaveData {
  const s = load();
  const d = s.done[chId] ?? { game: false, mini: false, boss: false, quizBest: 0 };
  d[key] = true;
  s.done[chId] = d;
  persist(s);
  return s;
}

/** อัปเดตคะแนนสูงสุดของโหมดตะลุยโจทย์ */
export function setQuizBest(chId: string, score: number): SaveData {
  const s = load();
  const d = s.done[chId] ?? { game: false, mini: false, boss: false, quizBest: 0 };
  d.quizBest = Math.max(d.quizBest, score);
  s.done[chId] = d;
  persist(s);
  return s;
}
