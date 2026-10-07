// ===== เสียง 8 บิต ด้วย Web Audio API =====

let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** เล่นโน้ตสี่เหลี่ยมสไตล์ 8 บิต */
function tone(freq: number, dur = 0.12, type: OscillatorType = "square", delay = 0, vol = 0.12) {
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const sfx = {
  /** เสียงกระโดด */
  jump() {
    tone(440, 0.08);
    tone(720, 0.1, "square", 0.06);
  },
  /** เสียงเก็บเหรียญ */
  coin() {
    tone(988, 0.08, "square", 0, 0.1);
    tone(1319, 0.22, "square", 0.08, 0.1);
  },
  /** ตอบถูก */
  correct() {
    [660, 880, 1175].forEach((f, i) => tone(f, 0.12, "square", i * 0.09));
  },
  /** ตอบผิด */
  wrong() {
    tone(220, 0.18, "sawtooth", 0, 0.14);
    tone(155, 0.3, "sawtooth", 0.14, 0.14);
  },
  /** เสียหัวใจ */
  hit() {
    tone(160, 0.25, "sawtooth", 0, 0.16);
    tone(110, 0.35, "sawtooth", 0.1, 0.16);
  },
  /** แฟนแฟร์ชนะด่าน */
  fanfare() {
    [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, 0.14, "square", i * 0.12, 0.13));
  },
  /** คลิกปุ่ม */
  click() {
    tone(700, 0.05, "square", 0, 0.07);
  },
  /** เก็บไอเทม */
  powerup() {
    [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.09, "triangle", i * 0.06, 0.14));
  },
};
