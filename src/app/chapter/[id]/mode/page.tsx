"use client";
// หน้าเลือกโหมด: โหมดเรียน / โหมดเกมบทนี้ / โหมดตะลุยโจทย์ / โหมดบอส
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { getChapter } from "@/data";
import { chapterStat } from "@/lib/storage";
import { useGameState } from "@/lib/useGameState";
import { sfx } from "@/lib/sound";

const MODES = [
  { key: "study", icon: "📖", title: "โหมดเรียน (จับมือสอน)", href: "study", color: "#5c94fc", desc: "สอนทีละสเต็ป 6 ขั้น ตั้งแต่ตัวอย่างใกล้ตัวจนถึงทริกและจุดที่มักพลาด", tag: "แนะนำก่อนเล่น" },
  { key: "play", icon: "🍄", title: "โหมดเกมบทนี้", href: "play", color: "#c84c0c", desc: "ด่านมาริโอ 8-Bit: ชนบล็อก ? ตอบโจทย์ เก็บเหรียญ เห็ดฮีลเลือด ซื้อไอเทมช่วย แล้วไปให้ถึงธงชัย", tag: "ได้ Badge" },
  { key: "minigame", icon: "🕹️", title: "โหมดมินิเกมประจำบท", href: "minigame", color: "#d946ef", desc: "มินิเกมเฉพาะตัวของบทนี้ ที่ผูกกับเนื้อหาคณิตศาสตร์โดยตรง", tag: "ไม่ซ้ำบทอื่น" },
  { key: "quiz", icon: "📝", title: "โหมดตะลุยโจทย์", href: "quiz", color: "#00a800", desc: "ทำโจทย์ทั้งบท 12 ข้อ ไล่ระดับ 🟢🟡🔴 วัดความเข้าใจ พร้อมเฉลยทีละขั้นทุกข้อ", tag: "วัดความเข้าใจ" },
  { key: "boss", icon: "👹", title: "โหมดบอสท้ายบท", href: "boss", color: "#b91c1c", desc: "โจทย์ยากจับเวลา 45 วินาทีต่อข้อ สไตล์ข้อสอบจริง มี Streak โบนัสและเหรียญพิเศษ", tag: "ยากสุด" },
];

export default function ModePage() {
  const params = useParams<{ id: string }>();
  const chapter = getChapter(params.id ?? "");
  const { state, ready } = useGameState();

  if (!chapter) {
    return (
      <div className="pixel-box bg-[#1b1140] p-6 text-center">
        <p className="font-pixel text-sm text-red-400">404 — ไม่พบบทเรียนนี้</p>
        <Link href="/select" className="pixel-btn mt-4 inline-block bg-[#fbd000] px-4 py-2 text-sm text-[#0b0620]">◀ กลับ</Link>
      </div>
    );
  }

  const st = chapterStat(state, chapter.id);
  const total = st.correct + st.wrong;
  const acc = total ? Math.round((st.correct / total) * 100) : 0;

  return (
    <div className="space-y-4">
      <header className="pixel-box p-4" style={{ background: `linear-gradient(135deg, ${chapter.color}44, #1b1140)` }}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-5xl">{chapter.emoji}</span>
          <div>
            <p className="font-pixel text-[10px] text-white/60">SELECT MODE</p>
            <h1 className="text-xl font-extrabold" style={{ color: chapter.color }}>
              {chapter.title}
            </h1>
            <p className="text-xs text-white/70">
              ม.{chapter.level.replace("m", "")} เล่ม {chapter.book} · บท {chapter.no} · โจทย์ {chapter.questions.length} ข้อ
            </p>
          </div>
          <Link href={`/select/${chapter.level}`} className="pixel-btn ml-auto bg-[#0b0620] px-3 py-2 text-xs text-white">◀ บทอื่น</Link>
        </div>

        {ready && (
          <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-5">
            <span className="pixel-box bg-black/30 px-2 py-1.5">เล่นแล้ว {st.played} ครั้ง</span>
            <span className="pixel-box bg-black/30 px-2 py-1.5">ความแม่น {acc}%</span>
            <span className="pixel-box bg-black/30 px-2 py-1.5">คะแนนสูงสุด {st.bestScore}</span>
            <span className="pixel-box bg-black/30 px-2 py-1.5">ผ่านด่าน {state.cleared.includes(chapter.id) ? "✔" : "✘"}</span>
            <span className="pixel-box bg-black/30 px-2 py-1.5">Badge {state.badges.filter((b) => b.chapterId === chapter.id).length}</span>
          </div>
        )}
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        {MODES.map((m, i) => (
          <motion.div key={m.key} initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <Link
              href={`/chapter/${chapter.id}/${m.href}`}
              onClick={() => sfx.power()}
              className="pixel-box flex h-full flex-col bg-[#120a26] p-4 transition hover:-translate-y-1"
              style={{ borderTopColor: m.color, borderTopWidth: 8 }}
            >
              <div className="mb-2 flex items-center gap-3">
                <motion.span animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2, delay: i * 0.2 }} className="text-4xl">
                  {m.icon}
                </motion.span>
                <div>
                  <h2 className="text-base font-extrabold text-white">{m.title}</h2>
                  <span className="pixel-btn px-2 py-0.5 text-[10px] text-[#0b0620]" style={{ background: m.color }}>
                    {m.tag}
                  </span>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-white/75">{m.desc}</p>
              {m.key === "minigame" && (
                <p className="mt-2 border-l-4 bg-white/5 px-2 py-1 text-[11px]" style={{ borderColor: m.color }}>
                  🎮 ของบทนี้: <b>{chapter.miniGame.title}</b> — {chapter.miniGame.desc}
                </p>
              )}
              {m.key === "boss" && (
                <p className="mt-2 border-l-4 border-red-500 bg-red-900/25 px-2 py-1 text-[11px] text-red-200">
                  👹 {chapter.bossName}: {chapter.bossIntro}
                </p>
              )}
              <span className="mt-auto pt-3 text-right font-pixel text-[10px]" style={{ color: m.color }}>
                PRESS START ▶
              </span>
            </Link>
          </motion.div>
        ))}
      </div>

      <p className="text-center text-[11px] text-white/50">
        💡 คำแนะนำ: เรียนโหมดเรียนก่อน → เล่นด่านมาริโอ → เล่นมินิเกม → ทำแบบทดสอบ → ปิดท้ายด้วยโหมดบอส
      </p>
    </div>
  );
}
