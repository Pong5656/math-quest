// ระบบเสียง 8-Bit ด้วย Web Audio API (ไม่ใช้ไฟล์เสียงภายนอก)
let ctx: AudioContext | null = null;
let muted = false;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function setMuted(v: boolean) {
  muted = v;
  if (typeof window !== "undefined") localStorage.setItem("mq_muted", v ? "1" : "0");
}
export function getMuted() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("mq_muted") === "1";
}

/** เล่นโน้ตสี่เหลี่ยม (square wave) สไตล์เครื่อง NES */
function beep(freq: number, dur = 0.08, type: OscillatorType = "square", vol = 0.09, delay = 0) {
  const a = ac();
  if (!a || muted) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t = a.currentTime + delay;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export const sfx = {
  jump: () => { beep(330, 0.06); beep(660, 0.08, "square", 0.08, 0.05); },
  coin: () => { beep(988, 0.06, "square", 0.09); beep(1319, 0.16, "square", 0.08, 0.06); },
  correct: () => { [523, 659, 784, 1047].forEach((f, i) => beep(f, 0.1, "square", 0.09, i * 0.07)); },
  wrong: () => { beep(196, 0.16, "sawtooth", 0.09); beep(147, 0.26, "sawtooth", 0.09, 0.14); },
  power: () => { [392, 523, 659, 784, 1047].forEach((f, i) => beep(f, 0.07, "triangle", 0.1, i * 0.05)); },
  stomp: () => { beep(220, 0.07, "triangle", 0.1); beep(110, 0.1, "triangle", 0.1, 0.05); },
  bump: () => beep(120, 0.06, "square", 0.1),
  heal: () => { [659, 880, 1175].forEach((f, i) => beep(f, 0.1, "sine", 0.11, i * 0.08)); },
  fanfare: () => {
    const notes = [523, 523, 523, 659, 784, 659, 784, 1047];
    notes.forEach((f, i) => beep(f, 0.14, "square", 0.1, i * 0.13));
  },
  gameover: () => { [392, 330, 262, 196, 147].forEach((f, i) => beep(f, 0.22, "triangle", 0.1, i * 0.16)); },
  tick: () => beep(880, 0.03, "square", 0.05),
  boss: () => { [147, 175, 196, 147].forEach((f, i) => beep(f, 0.18, "sawtooth", 0.09, i * 0.14)); },
};
