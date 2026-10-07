// ══════════════════════════════════════════════════════════
// minigameData — ตัวสร้างโจทย์/ภารกิจของมินิเกมประจำบททั้ง 18 แบบ
// ทุกครั้งที่เราเล่น ระบบจะ "สุ่มโจทย์ใหม่" เสมอ ทำให้เล่นซ้ำได้ไม่เบื่อ
// ══════════════════════════════════════════════════════════

export interface MgRound {
  prompt: string;
  options: string[];
  answer: number;
  explain: string;
}
export interface MgSetItem {
  icon: string;
  name: string;
  tags: string[];
}
export interface MgSetRound {
  prompt: string;
  expr: string;
  items: MgSetItem[];
  correct: number[];
  explain: string;
}
export interface MgLogicRound {
  prompt: string;
  expr: string;
  target: boolean;
  /** ฟังก์ชันตรวจสอบค่าความจริงจาก [p,q,r] */
  check: (v: boolean[]) => boolean;
  explain: string;
}
export interface MgWaveRound {
  prompt: string;
  targetA: number;
  targetB: number;
  explain: string;
}

const ri = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const T = (s: string) => `\\(${s}\\)`;

/** สับตำแหน่งตัวเลือกแล้วคืนดัชนีคำตอบ */
function make(correct: string, wrongs: string[]): { options: string[]; answer: number } {
  // กำจัดตัวเลือกล้ำ/ซ้ำกับคำตอบที่ถูก แล้วเติมให้ครบ 4 ตัว
  const uniq = Array.from(new Set(wrongs.filter((w) => w !== correct && !!w))).slice(0, 3);
  while (uniq.length < 3) uniq.push(`ตัวเลือก ${uniq.length + 1}`);
  const shuffled = [...uniq, correct].sort(() => Math.random() - 0.5);
  return { options: shuffled, answer: shuffled.indexOf(correct) };
}

/** ตัวสร้างรอบเกมแบบปรนัย (ใช้กับมินิเกมส่วนใหญ่) */
export type RoundGen = () => MgRound;

const GENS: Record<string, RoundGen[]> = {
  // 🌉 Interval Runner — สะพานช่วงคำตอบของอสมการ
  "interval-runner": [
    () => {
      const a = ri(-6, 0);
      const b = a + ri(2, 7);
      const lt = Math.random() < 0.5;
      const expr = lt ? `${T(`x^2-${a + b}x+${a * b}<0`)}` : `${T(`(x-${a})(x-${b})>0`)}`;
      const correct = lt ? `${T(`(${a},${b})`)}` : `${T(`(-\\infty,${a})\\cup(${b},\\infty)`)}`;
      const { options, answer } = make(correct, [
        `${T(`[${a},${b}]`)}`,
        lt ? `${T(`(-\\infty,${a})\\cup(${b},\\infty)`)}` : `${T(`(${a},${b})`)}`,
        `${T(`(${b},${a + b * 2})`)}`,
      ]);
      return {
        prompt: `สะพานจะปรากฏเฉพาะช่วงคำตอบของอสมการ ${expr} วิ่งไปช่วงใดจึงปลอดภัย?`,
        options,
        answer,
        explain: lt
          ? `แยกตัวประกอบได้ ${T(`(x-${a})(x-${b})<0`)} พาราโบลาหงาย ค่าลบอยู่ "ระหว่างราก" จึงได้ ${T(`(${a},${b})`)}`
          : `พาราโบลาหงาย ค่าบวกอยู่ "นอกช่วงราก" จึงได้ ${T(`(-\\infty,${a})\\cup(${b},\\infty)`)}`,
      };
    },
    () => {
      const c = ri(-5, 5);
      const d = ri(2, 6);
      const correct = `${T(`(${c - d},${c + d})`)}`;
      const { options, answer } = make(correct, [
        `${T(`(${c},${d})`)}`,
        `${T(`(-\\infty,${c + d})`)}`,
        `${T(`(${c + d},\\infty)`)}`,
      ]);
      return {
        prompt: `Safe Zone ของอสมการค่าสัมบูรณ์ ${T(`|x-${c}|<${d}`)} คือช่วงใด?`,
        options,
        answer,
        explain: `${T(`|x-c|<d \\Leftrightarrow -d<x-c<d`)} บวก c ทุกข้างได้ ${T(`${c - d}<x<${c + d}`)}`,
      };
    },
  ],

  // 🏭 Composite Factory — เรียงเครื่องจักร f, g
  "composite-factory": [
    () => {
      const a = ri(1, 3), b = ri(1, 5), c = ri(1, 3), d = ri(1, 5), k = ri(1, 4);
      const f = (x: number) => a * x + b;
      const g = (x: number) => c * x + d;
      const gf = g(f(k));
      const fg = f(g(k));
      const correct = `${gf}`;
      const { options, answer } = make(correct, [`${fg}`, `${gf + c}`, `${a * c * k}`]);
      return {
        prompt: `ใบสั่งยาต้องการผล ${(T(`(g\\circ f)(${k})`))} โดยเครื่อง ${T(`f(x)=${a}x+${b}`)} และ ${T(`g(x)=${c}x+${d}`)} ต้องป้อนวัตถุดิบเข้าเครื่องใดก่อน?`,
        options,
        answer,
        explain: `${T(`(g\\circ f)(x)=g(f(x))`)} → ใส่ f ก่อน: ${T(`f(${k})=${f(k)}`)} แล้วเข้า g: ${T(`g(${f(k)})=${gf}`)} (ถ้าเรียงผิดจะได้ ${fg})`,
      };
    },
  ],

  // 🧟 Outbreak: Logarithmic Cure — ไวรัสโตแบบเอกซ์โปฯ
  "outbreak-log": [
    () => {
      const n0 = pick([1, 2, 5]);
      const t = ri(2, 6);
      const N = n0 * Math.pow(2, t);
      const correct = `${t}`;
      const { options, answer } = make(correct, [`${t + 1}`, `${N / 2}`, `${2 * t}`]);
      return {
        prompt: `ไวรัสแพร่จาก ${n0} ตัวเป็น ${N} ตัวตามรุ่น ${T(`N=${n0}\\cdot 2^{t}`)} เซรั่มจะออกฤทธิ์เมื่อฉีดในรุ่นที่เท่าใด (หา ${T(`\\log_2(N/${n0})`)})?`,
        options,
        answer,
        explain: `${T(`\\log_2(N/n_0)=\\log_2 2^{t}=t`)} ดังนั้นต้องฉีดเซรั่มในรุ่นที่ ${t}`,
      };
    },
    () => {
      const base = pick([10, 2, 3]);
      const k = ri(2, 4);
      const v = Math.pow(base, k);
      const correct = `${k}`;
      const { options, answer } = make(correct, [`${v}`, `${k + 1}`, `${base * k}`]);
      return {
        prompt: `ระดับพลังเซรั่มอ่านได้จาก ${T(`\\log_{${base}}${v}`)} ค่าที่ได้คือเท่าใด?`,
        options,
        answer,
        explain: `${T(`${base}^{${k}=${v}`)} ดังนั้น ${T(`\\log_{${base}}${v}=${k}`)}`,
      };
    },
  ],

  // 🗼 Conic Tower Defense — วางป้อมตามชนิดภาคตัดกรวย
  "conic-tower": [
    () => {
      const h = ri(-4, 4), k = ri(-4, 4), r = ri(2, 6);
      const correct = `${T(`(${h},${k})`)}`;
      const { options, answer } = make(correct, [`${T(`(${-h},${-k})`)}`, `${T(`(${h + r},${k})`)}`, `${T(`(0,0)`)}`]);
      return {
        prompt: `สร้างป้อมวงกลมตามสมการ ${T(`(x-${h >= 0 ? h : `(${h})`})^2+(y-${k >= 0 ? k : `(${k})`})^2=${r * r}`)} จุดศูนย์กลางที่ต้องวางป้อมคือที่ใด?`,
        options,
        answer,
        explain: `รูปมาตรฐาน ${T(`(x-h)^2+(y-k)^2=r^2`)} → ศูนย์กลาง ${T(`(${h},${k})`)} รัศมี ${r}`,
      };
    },
    () => {
      const c = ri(1, 5);
      const correct = `${T(`(${c},0)`)}`;
      const { options, answer } = make(correct, [`${T(`(${2 * c},0)`)}`, `${T(`(0,${c})`)}`, `${T(`(${-c},0)`)}`]);
      return {
        prompt: `ป้อมพาราโบลา ${T(`y^2=${4 * c}x`)} ยิงได้ไกลที่สุดที่จุดโฟกัส โฟกัสอยู่ที่ใด?`,
        options,
        answer,
        explain: `เทียบกับ ${T(`y^2=4cx`)} ได้ ${T(`c=${c}`)} โฟกัสคือ ${T(`(${c},0)`)}`,
      };
    },
    () => {
      const a = ri(2, 5), b = ri(2, 5);
      const correct = `ไฮเพอร์โบลา`;
      const { options, answer } = make(correct, [`วงรี`, `พาราโบลา`, `วงกลม`]);
      return {
        prompt: `ศัตรูบุกมาตามสมการ ${T(`\\frac{x^2}{${a * a}}-\\frac{y^2}{${b * b}}=1`)} ต้องเลือกป้อมชนิดใด?`,
        options,
        answer,
        explain: `เครื่องหมาย "ลบ" ระหว่างพจน์กำลังสอง → ไฮเพอร์โบลา (บวก = วงรี/วงกลม, มีตัวเดียวกำลังสอง = พาราโบลา)`,
      };
    },
  ],

  // 🦾 Mecha Matrix Transformer
  "matrix-mecha": [
    () => {
      const a = ri(1, 5), b = ri(1, 4), c = ri(1, 4), d = ri(1, 5);
      const det = a * d - b * c;
      const correct = `${det}`;
      const { options, answer } = make(correct, [`${a * d + b * c}`, `${det + 1}`, `${-det || 3}`]);
      return {
        prompt: `ปลดล็อกแกนพลังงานหุ่นยนต์ด้วย ${T(`\\det\\begin{bmatrix}${a}&${b}\\\\${c}&${d}\\end{bmatrix}`)} ค่าเท่าใด?`,
        options,
        answer,
        explain: `${T(`ad-bc=${a}(${d})-${b}(${c})=${a * d}-${b * c}=${det}`)}`,
      };
    },
    () => {
      const a = ri(1, 3), b = ri(1, 3), c = ri(1, 3), d = ri(1, 3);
      const e = ri(1, 3), f = ri(1, 3);
      const r1 = a * e + b * f;
      const correct = `${r1}`;
      const { options, answer } = make(correct, [`${a * e + b * e}`, `${r1 + c}`, `${a + e}`]);
      return {
        prompt: `แปลงพิกัดหุ่น: ผลคูณ ${T(`\\begin{bmatrix}${a}&${b}\\\\${c}&${d}\\end{bmatrix}\\begin{bmatrix}${e}\\\\${f}\\end{bmatrix}`)} สมาชิกแถวแรกคือเท่าใด?`,
        options,
        answer,
        explain: `แถวจับหลัก: ${T(`${a}(${e})+${b}(${f})=${r1}`)}`,
      };
    },
  ],

  // 🛸 Space Vector Navigator
  "vector-nav": [
    () => {
      const a = ri(1, 4), b = ri(1, 4), c = ri(-4, 4), d = ri(-4, 4);
      const dot = a * c + b * d;
      const correct = `${dot}`;
      const { options, answer } = make(correct, [`${a * c - b * d}`, `${dot + 2}`, `${a + b + c + d}`]);
      return {
        prompt: `ยานพบอุกกาบาตที่ ${T(`\\langle ${a},${b}\\rangle`)} และลมสุริยะ ${T(`\\langle ${c},${d}\\rangle`)} ค่า dot product (บอกทิศปะทะ) เท่ากับเท่าใด?`,
        options,
        answer,
        explain: `${T(`\\vec u\\cdot\\vec v=${a}(${c})+${b}(${d})=${dot}`)} ${dot === 0 ? "→ ตั้งฉากกันพอดี บินผ่านได้ปลอดภัย" : ""}`,
      };
    },
    () => {
      const a = ri(2, 6), b = ri(2, 6);
      const mag = Math.sqrt(a * a + b * b);
      const nice = Number.isInteger(mag);
      const correct = nice ? `${mag}` : `${T(`\\sqrt{${a * a + b * b}}`)}`;
      const { options, answer } = make(correct, [`${a + b}`, `${a * b}`, `${nice ? mag + 1 : T(`\\sqrt{${a + b}}`)}`]);
      return {
        prompt: `ยานต้องเคลื่อนที่ตามเวกเตอร์ ${T(`\\langle ${a},${b},0\\rangle`)} ระยะทางที่ต้องบิน (ขนาดเวกเตอร์) เท่ากับเท่าใด?`,
        options,
        answer,
        explain: `${T(`|\\vec u|=\\sqrt{${a}^2+${b}^2}=${nice ? mag : T(`\\sqrt{${a * a + b * b}}`)}`)}`,
      };
    },
  ],

  // 🪄 Complex Dimension Arcana
  "complex-arcana": [
    () => {
      const a = ri(1, 6), b = ri(1, 6);
      const r2 = a * a + b * b;
      const nice = Number.isInteger(Math.sqrt(r2));
      const correct = nice ? `${Math.sqrt(r2)}` : `${T(`\\sqrt{${r2}}`)}`;
      const { options, answer } = make(correct, [`${a + b}`, `${r2}`, `${nice ? Math.sqrt(r2) + 1 : T(`\\sqrt{${a + b}}`)}`]);
      return {
        prompt: `แปลงเวท ${T(`${a}+${b}i`)} เป็นรัศมีในรูปขั้ว ${T(`[r,\\theta]`)} ค่า r เท่ากับเท่าใด?`,
        options,
        answer,
        explain: `${T(`r=|z|=\\sqrt{${a}^2+${b}^2}=${nice ? Math.sqrt(r2) : T(`\\sqrt{${r2}}`)}`)}`,
      };
    },
    () => {
      const k = ri(2, 5);
      const correct = `${T(`\\mathrm{cis}\\,${90 * k % 360}^\\circ`)}`;
      const { options, answer } = make(correct, [`${T(`\\mathrm{cis}\\,${90 * k}^\\circ`)}`, `${T(`${k}\\,\\mathrm{cis}\\,90^\\circ`)}`, `${T(`\\mathrm{cis}\\,${45 * k}^\\circ`)}`]);
      return {
        prompt: `ยิงคาถา ${T(`(\\mathrm{cis}\\,90^\\circ)^{${k}}`)} ด้วยทฤษฎีเดอมัวฟร์ ได้ผลลัพธ์ตรงกับข้อใด?`,
        options,
        answer,
        explain: `เดอมัวฟร์: ขนาดยกกำลัง ${k} (=1) มุมคูณ ${k} → ${T(`\\mathrm{cis}\\,${(90 * k) % 360}^\\circ`)}`,
      };
    },
  ],

  // 💻 Mastermind Hacker
  "mastermind": [
    () => {
      const n = ri(5, 9), r = ri(2, 3);
      let p = 1;
      for (let i = 0; i < r; i++) p *= n - i;
      const correct = `${p}`;
      const { options, answer } = make(correct, [`${Math.pow(n, r)}`, `${n * r}`, `${p / 2}`]);
      return {
        prompt: `ระบบล็อกด้วยรหัส ${r} ตัวจากสัญลักษณ์ ${n} ตัว "ห้ามซ้ำ" จำนวนรหัสที่ต้องลองทั้งหมดคือเท่าใด?`,
        options,
        answer,
        explain: `ใช้ ${T(`P(${n},${r})=${n}\\times${n - 1}${r > 2 ? `\\times${n - 2}` : ""}=${p}`)}`,
      };
    },
    () => {
      const n = ri(6, 12), r = ri(2, 3);
      let c = 1;
      for (let i = 0; i < r; i++) c *= n - i;
      let f = 1;
      for (let i = 1; i <= r; i++) f *= i;
      const val = c / f;
      const correct = `${val}`;
      const { options, answer } = make(correct, [`${val * 2}`, `${c}`, `${n * r}`]);
      return {
        prompt: `เลือกทีมแฮกเกอร์ ${r} คนจาก ${n} คน (ไม่สนลำดับ) มีวิธีเลือกกี่วิธี?`,
        options,
        answer,
        explain: `${T(`C(${n},${r})=\\frac{${n}!}{${r}!${n - r}!}=${val}`)}`,
      };
    },
  ],

  // 🎲 Dice & Destiny
  "dice-destiny": [
    () => {
      const sum = ri(5, 9);
      const pairs: number[][] = [];
      for (let i = 1; i <= 6; i++) for (let j = 1; j <= 6; j++) if (i + j === sum) pairs.push([i, j]);
      const correct = `${T(`\\frac{${pairs.length}}{36}`)}`;
      const { options, answer } = make(correct, [`${T(`\\frac{${pairs.length + 1}}{36}`)}`, `${T(`\\frac{${pairs.length}}{12}`)}`, `${T(`\\frac{6}{36}`)}`]);
      return {
        prompt: `ช่องต่อไปต้องทอยลูกเต๋า 2 ลูกให้ผลรวมเป็น ${sum} ความน่าจะเป็นที่จะผ่านช่องนี้เท่ากับเท่าใด?`,
        options,
        answer,
        explain: `คู่ที่ได้ผลรวม ${sum} มี ${pairs.length} วิธี จากทั้งหมด 36 → ${T(`\\frac{${pairs.length}}{36}`)}`,
      };
    },
    () => {
      const n = ri(2, 4);
      const correct = `${T(`\\frac{${Math.pow(2, n) - 1}}{${Math.pow(2, n)}}`)}`;
      const { options, answer } = make(correct, [`${T(`\\frac{1}{${Math.pow(2, n)}}`)}`, `${T(`\\frac{1}{2}`)}`, `${T(`\\frac{${n}}{${2 * n}}`)}`]);
      return {
        prompt: `ทอยเหรียญ ${n} ครั้ง ความน่าจะเป็นที่จะได้หัว "อย่างน้อย 1 ครั้ง" เท่ากับเท่าใด?`,
        options,
        answer,
        explain: `ใช้คอมพลีเมนต์ ${T(`1-P(\\text{ไม่มีหัว})=1-\\frac{1}{${Math.pow(2, n)}}=\\frac{${Math.pow(2, n) - 1}}{${Math.pow(2, n)}}`)}`,
      };
    },
  ],

  // 🏦 Idle Tycoon
  "idle-tycoon": [
    () => {
      const a1 = ri(2, 9), d = ri(2, 6), n = ri(5, 12);
      const an = a1 + (n - 1) * d;
      const correct = `${an}`;
      const { options, answer } = make(correct, [`${a1 + n * d}`, `${an - d}`, `${a1 * n}`]);
      return {
        prompt: `สินทรัพย์ A ให้ผลตอบแทนเป็นลำดับเลขคณิต ${a1}, ${a1 + d}, ${a1 + 2 * d}, … เดือนที่ ${n} จะได้ผลตอบแทนเท่าใด?`,
        options,
        answer,
        explain: `${T(`a_n=a_1+(n-1)d=${a1}+(${n}-1)(${d})=${an}`)}`,
      };
    },
    () => {
      const a1 = ri(1, 4), r = pick([2, 3]);
      const n = ri(3, 5);
      const s = a1 * (Math.pow(r, n) - 1) / (r - 1);
      const correct = `${s}`;
      const { options, answer } = make(correct, [`${a1 * Math.pow(r, n)}`, `${s + a1}`, `${a1 * n * r}`]);
      return {
        prompt: `สินทรัพย์ B โตแบบเรขาคณิต เริ่ม ${a1} ล้านบาท อัตราส่วน ${r} เท่า รวม ${n} ปี มูลค่าสะสมทั้งหมดเท่ากับเท่าใด?`,
        options,
        answer,
        explain: `${T(`S_n=a_1\\frac{r^n-1}{r-1}=${a1}\\cdot\\frac{${r}^{${n}}-1}{${r - 1}}=${s}`)}`,
      };
    },
  ],

  // 🎢 Calculus Coaster Designer
  "calculus-coaster": [
    () => {
      const a = ri(1, 4), n = ri(2, 4);
      const correct = `${T(`${a * n}x^{${n - 1}}`)}`;
      const { options, answer } = make(correct, [`${T(`${a}x^{${n}}`)}`, `${T(`${a * n}x^{${n}}`)}`, `${T(`${a * (n + 1)}x^{${n}}`)}`]);
      return {
        prompt: `รางรถไฟเหาะมีรูปทรง ${T(`y=${a}x^{${n}}`)} ความชันของราง (dy/dx) ที่จุดใด ๆ เท่ากับเท่าใด?`,
        options,
        answer,
        explain: `กฎกำลัง: ${T(`\\frac{d}{dx}${a}x^{${n}}=${a}\\cdot${n}x^{${n - 1}}=${a * n}x^{${n - 1}}`)}`,
      };
    },
    () => {
      const b = ri(2, 6);
      const c = ri(1, 5);
      const xm = b / 2;
      const correct = Number.isInteger(xm) ? `${xm}` : `${T(`\\frac{${b}}{2}`)}`;
      const { options, answer } = make(correct, [`${b}`, `${c}`, `${b * 2}`]);
      return {
        prompt: `จุดสูงสุดของราง ${T(`y=-x^2+${b}x-${c}`)} (จุดที่รถเหาะช้าที่สุด) อยู่ที่ x เท่าใด?`,
        options,
        answer,
        explain: `${T(`y'=-2x+${b}=0 \\Rightarrow x=\\frac{${b}}{2}`)} และ ${T(`y''=-2<0`)} จึงเป็นจุดสูงสุด`,
      };
    },
    () => {
      const n = ri(1, 3), b = ri(2, 4);
      const val = Math.pow(b, n + 1) / (n + 1);
      const correct = Number.isInteger(val) ? `${val}` : `${T(`\\frac{${Math.pow(b, n + 1)}}{${n + 1}}`)}`;
      const { options, answer } = make(correct, [`${Math.pow(b, n)}`, `${val + 1}`, `${T(`\\frac{${Math.pow(b, n)}}{${n}}`)}`]);
      return {
        prompt: `พื้นที่ฐานรองรับรางคือ ${T(`\\int_0^{${b}} ${n === 1 ? "x" : `x^{${n}}`}\\,dx`)} มีค่าเท่าใด?`,
        options,
        answer,
        explain: `${T(`\\int_0^{${b}}x^{${n}}dx=\\left[\\frac{x^{${n + 1}}}{${n + 1}}\\right]_0^{${b}}=\\frac{${Math.pow(b, n + 1)}}{${n + 1}}`)}`,
      };
    },
  ],

  // 🕵️ Fact-Checking Detective
  "fact-check": [
    () => {
      const cases: [string, string, string][] = [
        ["จำนวนคนที่ตอบแบบสอบถาม", "เชิงปริมาณแบบไม่ต่อเนื่อง", "นับได้เป็นจำนวนเต็ม"],
        ["ระดับความพึงพอใจ (มาก/ปานกลาง/น้อย)", "เชิงคุณภาพแบบเรียงลำดับ", "เป็นหมวดที่มีลำดับ"],
        ["น้ำหนักของพัสดุ", "เชิงปริมาณแบบต่อเนื่อง", "วัดได้เป็นทศนิยม"],
        ["สีรถที่ลูกค้าชอบ", "เชิงคุณภาพแบบไม่เรียงลำดับ", "เป็นหมวดหมู่ไม่มีลำดับ"],
        ["เวลาที่ใช้ในการโหลดหน้าเว็บ", "เชิงปริมาณแบบต่อเนื่อง", "วัดได้ด้วยนาฬิกา"],
        ["จำนวนคลิกต่อโพสต์", "เชิงปริมาณแบบไม่ต่อเนื่อง", "นับครั้งได้"],
      ];
      const c = pick(cases);
      const correct = c[1];
      const { options, answer } = make(correct, [
        "เชิงปริมาณแบบต่อเนื่อง",
        "เชิงคุณภาพแบบเรียงลำดับ",
        "เชิงปริมาณแบบไม่ต่อเนื่อง",
        "เชิงคุณภาพแบบไม่เรียงลำดับ",
      ].filter((o) => o !== correct));
      return { prompt: `ข่าวชิ้นหนึ่งรายงาน "${c[0]}" ข้อมูลนี้จัดเป็นชนิดใด?`, options, answer, explain: `${c[0]} → ${c[1]} เพราะ${c[2]}` };
    },
    () => {
      const bias: [string, string][] = [
        ["โพลในทวิตเตอร์ที่ถามว่า 'คุณรักดาราคนไหน'", "ตัวอย่างมีอคติ (selection bias) เพราะมีแต่แฟนคลับเข้ามาตอบ"],
        ["กราฟแท่งที่แกน y เริ่มที่ 50 แทน 0", "บิดเบือนด้วยสเกลแกน ทำให้ความต่างดูใหญ่เกินจริง"],
        ["สำรวจความเห็นจากลูกค้าที่มาซื้อที่หน้าร้านเท่านั้น", "อคติจากการเลือก เพราะคนไม่พอใจย่อมไม่มาซื้อ"],
        ["สรุปว่ากินวิตามินทำให้อายุยืน จากการศึกษาคนกินวิตามิน 100 คน", "สรุปเชิงสาเหตุจากความสัมพันธ์ ไม่มีกลุ่มควบคุม"],
      ];
      const b = pick(bias);
      const correct = "เชื่อถือไม่ได้ มีอคติในการเก็บข้อมูล";
      const { options, answer } = make(correct, ["เชื่อถือได้เพราะมีข้อมูลจริง", "เชื่อถือได้ถ้าขนาดตัวอย่างใหญ่", "ไม่สามารถตัดสินได้เพราะไม่มีตัวเลข"]);
      return { prompt: `ตรวจสอบข่าว: "${b[0]}" ข้อสรุปใดถูกต้อง?`, options, answer, explain: b[1] };
    },
  ],

  // 🎤 Idol Agency Manager
  "idol-agency": [
    () => {
      const N = pick([100, 200, 250, 500]);
      const f = Math.floor(N * pick([0.15, 0.2, 0.25, 0.4, 0.45]));
      const pct = (f / N) * 100;
      const correct = `${pct}%`;
      const { options, answer } = make(correct, [`${pct + 5}%`, `${(f / N).toFixed(2)}`, `${f}%`]);
      return {
        prompt: `แฟนคลับ ${N} คน ชอบสมาชิก A จำนวน ${f} คน ความถี่สัมพัทธ์ร้อยละของ A เท่ากับเท่าใด?`,
        options,
        answer,
        explain: `${T(`\\frac{${f}}{${N}}\\times100=${pct}\\%`)}`,
      };
    },
    () => {
      const pct = pick([10, 20, 25, 30, 45]);
      const deg = (pct / 100) * 360;
      const correct = `${deg}°`;
      const { options, answer } = make(correct, [`${pct}°`, `${deg + 30}°`, `${360 - deg}°`]);
      return {
        prompt: `ต้องวาดกราฟวงกลมเสนอบอร์ด: หมวดที่ได้ ${pct}% ต้องใช้มุมกี่องศา?`,
        options,
        answer,
        explain: `${T(`\\frac{${pct}}{100}\\times360^\\circ=${deg}^\\circ`)} (ลัด: เปอร์เซ็นต์ × 3.6)`,
      };
    },
  ],

  // ⚽ Moneyball Manager
  "moneyball": [
    () => {
      const data = Array.from({ length: 5 }).map(() => ri(0, 8));
      const sum = data.reduce((a, b) => a + b, 0);
      const mean = sum / data.length;
      const correct = `${mean}`;
      const { options, answer } = make(correct, [`${sum}`, `${Math.max(...data)}`, `${(mean + 1).toFixed(1)}`]);
      return {
        prompt: `จำนวนประตู 5 นัดของนักเตะ: ${data.join(", ")} ค่าเฉลี่ยต่อเกมเท่ากับเท่าใด?`,
        options,
        answer,
        explain: `${T(`\\bar x=\\frac{${sum}}{5}=${mean}`)}`,
      };
    },
    () => {
      const data = Array.from({ length: 7 }).map(() => ri(1, 20)).sort((a, b) => a - b);
      const med = data[3];
      const correct = `${med}`;
      const { options, answer } = make(correct, [`${data[0]}`, `${data[6]}`, `${((data[2] + data[4]) / 2).toFixed(1)}`]);
      return {
        prompt: `คะแนนฟอร์ม 7 นัด (เรียงแล้ว): ${data.join(", ")} มัธยฐานคือเท่าใด?`,
        options,
        answer,
        explain: `n=7 (คี่) → ตัวที่ ${T(`\\frac{7+1}{2}=4`)} คือ ${med}`,
      };
    },
    () => {
      const q1 = ri(10, 25), q3 = q1 + ri(8, 20);
      const iqr = q3 - q1;
      const fence = q3 + 1.5 * iqr;
      const correct = `${fence}`;
      const { options, answer } = make(correct, [`${q3 + iqr}`, `${q1 - 1.5 * iqr}`, `${q3 + 2 * iqr}`]);
      return {
        prompt: `Box Plot ของค่าตัวนักเตะมี Q1=${q1}, Q3=${q3} รั้วบน (เกณฑ์ตัดสิน outlier) เท่ากับเท่าใด?`,
        options,
        answer,
        explain: `${T(`IQR=${q3}-${q1}=${iqr}`)} รั้วบน ${T(`Q_3+1.5\\,IQR=${q3}+${1.5 * iqr}=${fence}`)}`,
      };
    },
  ],

  // ☢️ Nuclear Reactor Safe-Guard
  "reactor-z": [
    () => {
      const mu = pick([100, 300, 500]);
      const sd = pick([5, 10, 20]);
      const x = mu + sd * pick([1, 2, -1, -2, 1.5]);
      const z = (x - mu) / sd;
      const correct = `${z}`;
      const { options, answer } = make(correct, [`${z * 2}`, `${(x - mu).toFixed(1)}`, `${z + 1}`]);
      return {
        prompt: `อุณหภูมิแกนเตา μ=${mu}°C, σ=${sd}°C วัดได้ ${x}°C ค่ามาตรฐาน Z เท่ากับเท่าใด?`,
        options,
        answer,
        explain: `${T(`Z=\\frac{X-\\mu}{\\sigma}=\\frac{${x}-${mu}}{${sd}}=${z}`)}`,
      };
    },
    () => {
      const z = pick([1, 2, 3]);
      const area: Record<number, string> = { 1: "ประมาณ 0.16", 2: "ประมาณ 0.025", 3: "ประมาณ 0.0015" };
      const correct = area[z];
      const { options, answer } = make(correct, ["ประมาณ 0.50", "ประมาณ 0.32", "ประมาณ 0.05"]);
      return {
        prompt: `ระบบต้องระบายความร้อนเมื่ออุณหภูมิสูงเกิน μ+${z}σ โอกาสที่จะเกิดเหตุการณ์นี้ (tail area) เท่ากับเท่าใด?`,
        options,
        answer,
        explain: `จากกฎ 68–95–99.7 หางด้านขวาของ ${z}σ คือ ${area[z]} (${z === 1 ? "1−0.68 หาร 2" : z === 2 ? "(1−0.95)/2" : "(1−0.997)/2"})`,
      };
    },
  ],
};

/** สร้างรอบเกม n รอบตามชนิดมินิเกม */
export function generateRounds(kind: string, n = 6): MgRound[] {
  const gens = GENS[kind] ?? GENS["interval-runner"];
  return Array.from({ length: n }).map((_, i) => gens[i % gens.length]());
}

// ─────────────────────────────────────────────
// 🕵️ "จัดกระเป๋าสายลับ" — เลือกไอเทมตามเงื่อนไขเซต (multi-select)
const BAG_ITEMS: MgSetItem[] = [
  { icon: "🔫", name: "ปืนพก", tags: ["โลหะ", "ผิดกฎหมาย", "อันตราย"] },
  { icon: "🗝️", name: "กุญแจผี", tags: ["โลหะ", "ผิดกฎหมาย"] },
  { icon: "💊", name: "เซรั่ม", tags: ["เคมี", "ผิดกฎหมาย"] },
  { icon: "📱", name: "มือถือ", tags: ["อิเล็กทรอนิกส์", "ถูกกฎหมาย"] },
  { icon: "🔦", name: "ไฟฉาย", tags: ["โลหะ", "อิเล็กทรอนิกส์", "ถูกกฎหมาย"] },
  { icon: "🧨", name: "ระเบิด", tags: ["โลหะ", "อันตราย", "ผิดกฎหมาย"] },
  { icon: "🥽", name: "แว่นไนท์วิชัน", tags: ["อิเล็กทรอนิกส์", "ถูกกฎหมาย"] },
  { icon: "🧪", name: "ขวดสารเคมี", tags: ["เคมี", "อันตราย", "ถูกกฎหมาย"] },
  { icon: "🪪", name: "บัตรปลอม", tags: ["ผิดกฎหมาย"] },
  { icon: "🧲", name: "แม่เหล็ก", tags: ["โลหะ", "ถูกกฎหมาย"] },
];

const SET_CONDS: { expr: string; test: (it: MgSetItem) => boolean; explain: string }[] = [
  {
    expr: "(โลหะ ∩ ผิดกฎหมาย) − อันตราย",
    test: (it) => it.tags.includes("โลหะ") && it.tags.includes("ผิดกฎหมาย") && !it.tags.includes("อันตราย"),
    explain: "หาอินเตอร์เซกชันของ 'โลหะ' กับ 'ผิดกฎหมาย' ก่อน แล้วลบสมาชิกที่มีป้าย 'อันตราย' ออก",
  },
  {
    expr: "อิเล็กทรอนิกส์ ∪ เคมี",
    test: (it) => it.tags.includes("อิเล็กทรอนิกส์") || it.tags.includes("เคมี"),
    explain: "ยูเนียน = รวมสมาชิกของทั้งสองเซต (นับซ้ำครั้งเดียว)",
  },
  {
    expr: "(ถูกกฎหมาย)′ ∩ โลหะ",
    test: (it) => !it.tags.includes("ถูกกฎหมาย") && it.tags.includes("โลหะ"),
    explain: "คอมพลีเมนต์ของ 'ถูกกฎหมาย' คือของที่ผิดกฎหมาย/ไม่ระบุ แล้วอินเตอร์เซกกับ 'โลหะ'",
  },
  {
    expr: "อันตราย − โลหะ",
    test: (it) => it.tags.includes("อันตราย") && !it.tags.includes("โลหะ"),
    explain: "ผลต่าง A−B = สมาชิกของ A ที่ไม่อยู่ใน B",
  },
  {
    expr: "(โลหะ ∪ อิเล็กทรอนิกส์) ∩ ผิดกฎหมาย",
    test: (it) => (it.tags.includes("โลหะ") || it.tags.includes("อิเล็กทรอนิกส์")) && it.tags.includes("ผิดกฎหมาย"),
    explain: "ทำในวงเล็บก่อน (ยูเนียน) แล้วค่อยอินเตอร์เซกกับ 'ผิดกฎหมาย'",
  },
];

export function generateSetRounds(n = 5): MgSetRound[] {
  return Array.from({ length: n }).map(() => {
    const cond = pick(SET_CONDS);
    const items = [...BAG_ITEMS].sort(() => Math.random() - 0.5).slice(0, 6);
    const correct = items.map((it, i) => (cond.test(it) ? i : -1)).filter((i) => i >= 0);
    return {
      prompt: `ประตูเซฟเฮาส์จะเปิดเมื่อเลือกไอเทมในกระเป๋าให้ตรงกับเซตที่กำหนด`,
      expr: cond.expr,
      items,
      correct,
      explain: `${cond.explain} → ไอเทมที่ถูกต้อง: ${correct.length ? correct.map((i) => items[i].name).join(", ") : "ไม่มีเลย (เซตว่าง)"}`,
    };
  });
}

// ─────────────────────────────────────────────
// 💣 "ถอดรหัสวงจรระเบิด" — สับสวิตช์ T/F ให้ตรงเงื่อนไข
const LOGIC_EXPRS: { expr: string; check: (v: boolean[]) => boolean; explain: string }[] = [
  { expr: "(p ∧ q) → r", check: (v) => !(v[0] && v[1]) || v[2], explain: "→ เป็นเท็จกรณีเดียวคือ หน้าจริง–หลังเท็จ" },
  { expr: "p ∨ (q ∧ r)", check: (v) => v[0] || (v[1] && v[2]), explain: "ทำในวงเล็บ (∧) ก่อน แล้วค่อย ∨ กับ p" },
  { expr: "~p ↔ q", check: (v) => !v[0] === v[1], explain: "↔ เป็นจริงเมื่อทั้งสองข้างมีค่าความจริงเหมือนกัน" },
  { expr: "(p → q) ∧ ~r", check: (v) => (!v[0] || v[1]) && !v[2], explain: "ต้องจริงทั้งสองก้อนที่เชื่อมด้วย ∧" },
  { expr: "~(p ∧ q) ∨ r", check: (v) => !(v[0] && v[1]) || v[2], explain: "เดอมอร์แกน: ~(p∧q) ≡ ~p ∨ ~q" },
  { expr: "(p ↔ q) → ~r", check: (v) => !(v[0] === v[1]) || !v[2], explain: "หน้าเป็น ↔ ต้องตรวจค่าเหมือนกันก่อน" },
];

export function generateLogicRounds(n = 5, target = true): MgLogicRound[] {
  return Array.from({ length: n }).map(() => {
    const e = pick(LOGIC_EXPRS);
    const t = Math.random() < 0.6 ? true : target;
    return {
      prompt: t
        ? `ตัดสายไฟสีแดง: ตั้งสวิตช์ p q r ให้วงจรมีค่าความจริงเป็น T (จริง)`
        : `ตัดสายไฟสีน้ำเงิน: ตั้งสวิตช์ p q r ให้วงจรมีค่าความจริงเป็น F (เท็จ)`,
      expr: e.expr,
      target: t,
      check: e.check,
      explain: `${e.explain} → ตรวจค่าที่เลือกทีละตัวเชื่อม`,
    };
  });
}

// ─────────────────────────────────────────────
// 🎛️ "Soundwave DJ" — ปรับ Amplitude / Period ให้ตรงคลื่นเป้าหมาย
export function generateWaveRounds(n = 4): MgWaveRound[] {
  return Array.from({ length: n }).map(() => {
    const A = pick([1, 2, 3, 4]);
    const B = pick([1, 2, 3, 4]);
    return {
      prompt: `ปรับปุ่มให้กราฟซ้อนทับคลื่นเป้าหมาย: ${T(`y=${A}\\sin(${B}x)`)}`,
      targetA: A,
      targetB: B,
      explain: `แอมพลิจูด A = ${A} (ความสูงยอดคลื่น) และ B = ${B} → คาบ ${T(`\\frac{2\\pi}{${B}}`)}`,
    };
  });
}
