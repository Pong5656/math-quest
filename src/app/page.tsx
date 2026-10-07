"use client";

// ===== หน้าแรก: แบนเนอร์ 8 บิต + วิธีเล่น + ปุ่มเริ่มผจญภัย =====

import Link from "next/link";
import { motion } from "framer-motion";
import { PixelButton } from "@/components/ui";

/** ฮีโร่พิกเซลวาดด้วย SVG */
function PixelHero() {
  const rows = [
    "....RRRR....",
    "...RRRRRR...",
    "...HHSSHS...",
    "..HSSSSSS...",
    "..HSSSSSS...",
    "...SSSSS....",
    "...RRRRR....",
    "..RRBRRBR...",
    ".RRRBBBRRR..",
    ".SSBBBBBSS..",
    ".SSBBBBBSS..",
    "..BBBBBBB...",
    "..BBB.BBB...",
    "..BBB.BBB...",
    ".HHH...HHH..",
    ".HHH...HHH..",
  ];
  const colors: Record<string, string> = { R: "#e52521", B: "#2a5fd0", S: "#ffcb9e", H: "#5c3317" };
  return (
    <svg viewBox="0 0 12 16" className="h-36 w-auto sm:h-44" shapeRendering="crispEdges">
      {rows.map((r, y) =>
        r.split("").map((ch, x) => (ch === "." ? null : <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={colors[ch]} />))
      )}
    </svg>
  );
}

function Cloud({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <motion.div
      className={`pointer-events-none absolute ${className}`}
      animate={{ x: [0, 30, 0] }}
      transition={{ duration: 7, repeat: Infinity, delay, ease: "easeInOut" }}
    >
      <div className="h-5 w-16 rounded-sm bg-white shadow-[0_4px_0_rgba(0,0,0,0.08)] sm:h-6 sm:w-20" />
      <div className="-mt-8 ml-4 h-5 w-10 rounded-sm bg-white sm:h-6 sm:w-12" />
    </motion.div>
  );
}

const HOW_TO = [
  { icon: "📖", title: "1) เรียนแบบจับมือ", desc: "อ่านหน้าเรียน 6 สเต็ป ตั้งแต่ตัวอย่างใกล้ตัวจนถึงทริกและจุดที่มักพลาด" },
  { icon: "🎮", title: "2) ลุยด่านมาริโอ", desc: "เดิน-กระโดดชนบล็อก ? เพื่อตอบโจทย์ เก็บเหรียญ เห็ด และดาว แล้ววิ่งไปชนธงชัย" },
  { icon: "🕹️", title: "3) เล่นมินิเกมประจำบท", desc: "แต่ละบทมีมินิเกมไม่ซ้ำกัน ผูกกับเนื้อหาโดยตรง เล่นสนุกได้ความรู้" },
  { icon: "🐲", title: "4) ท้าบอส + เก็บสถิติ", desc: "โหมดบอสจับเวลา 45 วิ เก็บเหรียญ แบดจ์ และทบทวนข้อผิดในสมุดอัตโนมัติ" },
];

const FEATURES = [
  { icon: "🟢🟡🔴", title: "โจทย์ 3 ระดับ", desc: "ง่าย → ประยุกต์ 1 ขั้น → ยากแนว A-Level" },
  { icon: "🧭", title: "เฉลยทีละขั้น", desc: "ทุกข้อมีวิธีทำ + ทริก + สูตรที่ใช้" },
  { icon: "📜", title: "คลังสูตร", desc: "ค้นหาได้ พร้อมวิธีจำและพิสูจน์ย่อ" },
  { icon: "📓", title: "สมุดข้อผิด", desc: "เก็บทุกข้อที่เคยพลาด ทบทวนแบบเว้นระยะ" },
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
      {/* แบนเนอร์ 8 บิต */}
      <section className="relative mt-6 overflow-hidden rounded-sm border-4 border-[#23273a] bg-gradient-to-b from-[#4aa8f5] to-[#8fd6ff] shadow-[8px_8px_0_rgba(23,27,42,0.4)]">
        <Cloud className="left-6 top-6" />
        <Cloud className="right-10 top-14" delay={1.2} />
        <Cloud className="left-1/3 top-4" delay={2.1} />
        <div className="relative z-10 flex flex-col items-center gap-6 px-6 py-10 sm:py-14 md:flex-row md:justify-center md:gap-12">
          <div className="text-center md:text-left">
            <p className="font-pixel text-[10px] text-yellow-300 sm:text-xs">คณิตศาสตร์เพิ่มเติม ม.4 – ม.6</p>
            <h1 className="mt-3 font-pixel text-2xl leading-10 text-white [text-shadow:4px_4px_0_#23273a] sm:text-4xl sm:leading-[3.5rem]">
              MATH QUEST
            </h1>
            <p className="mt-1 font-pixel text-[10px] leading-5 text-white [text-shadow:3px_3px_0_#23273a] sm:text-sm">
              ผจญภัยคณิตศาสตร์ 8 บิต
            </p>
            <p className="mt-4 max-w-xl text-sm font-medium text-white/95 sm:text-base">
              เกมมาริโอฝึกคณิตศาสตร์หลักสูตร สสวท. (2551 ปรับปรุง 2560) และ Project 14 — เรียนแบบจับมือทีละสเต็ป
              ลุยด่านโจทย์ 3 ระดับ เล่นมินิเกมประจำบท และท้าบอสใหญ่ทุกบท!
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
              <PixelButton color="bg-yellow-400" href="/select" className="px-8 py-4 text-sm">▶ เริ่มผจญภัย</PixelButton>
              <PixelButton color="bg-green-400" href="/formulas">📜 คลังสูตร</PixelButton>
            </div>
          </div>
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2.2 }} className="floaty">
            <PixelHero />
          </motion.div>
        </div>
        {/* พื้นอิฐ */}
        <div className="relative h-10 w-full border-t-4 border-[#23273a] bg-[#b45309]">
          <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "repeating-linear-gradient(90deg, #7c2d12 0 2px, transparent 2px 34px), repeating-linear-gradient(0deg, #7c2d12 0 2px, transparent 2px 20px)" }} />
        </div>
      </section>

      {/* วิธีเล่น */}
      <section className="mt-12">
        <h2 className="text-center font-pixel text-sm leading-6 text-[#23273a] sm:text-lg">วิธีเล่น 🎮</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_TO.map((h, i) => (
            <motion.div
              key={h.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="pixel-card bg-[#fff8e7] p-4"
            >
              <p className="text-3xl">{h.icon}</p>
              <p className="mt-2 text-base font-extrabold">{h.title}</p>
              <p className="mt-1 text-sm font-medium text-slate-600">{h.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* จุดเด่น */}
      <section className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="pixel-card bg-white p-4 text-center"
          >
            <p className="font-pixel text-xs leading-5 text-amber-600">{f.icon}</p>
            <p className="mt-2 text-base font-extrabold">{f.title}</p>
            <p className="mt-1 text-sm text-slate-600">{f.desc}</p>
          </motion.div>
        ))}
      </section>

      {/* ปุ่มลัด */}
      <section className="mt-12 flex flex-wrap items-center justify-center gap-3">
        <Link href="/select" className="pixel-btn rounded-sm bg-yellow-400 px-8 py-4 font-pixel text-sm text-[#23273a]">🎮 เริ่มผจญภัย</Link>
        <Link href="/notebook" className="pixel-btn rounded-sm bg-sky-300 px-6 py-4 font-pixel text-xs text-[#23273a]">📓 สมุดข้อผิด</Link>
        <Link href="/stats" className="pixel-btn rounded-sm bg-green-300 px-6 py-4 font-pixel text-xs text-[#23273a]">🏆 สถิติของฉัน</Link>
      </section>
    </main>
  );
}
