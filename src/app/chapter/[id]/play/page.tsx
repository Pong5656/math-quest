"use client";

// ===== หน้าเล่นเกม: โหมดด่านมาริโอ / มินิเกม / ตะลุยโจทย์ / บอส =====
// โหมดด่านมี "ร้านค้า" ให้ใช้เหรียญซื้อไอเทม (เห็ดฮีลเลือด / ดาวป้องกัน / ยาใบ้)

import Link from "next/link";
import { Suspense, use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Chapter, Diff } from "@/lib/types";
import { getChapter } from "@/data";
import { buyItem, getSave } from "@/lib/store";
import GameCanvas from "@/components/GameCanvas";
import MiniGameRunner from "@/components/MiniGame";
import { QuizRunner, BossBattle } from "@/components/Battle";
import { sfx } from "@/lib/sfx";

/** ร้านค้าไอเทมก่อนเริ่มด่าน */
function Shop({ onRefresh }: { onRefresh: () => void }) {
  const [save, setSave] = useState(getSave());
  const [msg, setMsg] = useState("");

  const buy = (item: "mushroom" | "star" | "hint", price: number, name: string) => {
    if (buyItem(item, price)) {
      sfx.coin();
      setMsg(`ซื้อ${name}สำเร็จ! ใช้ระหว่างด่านได้จากปุ่มไอเทมด้านบน`);
      const s = getSave();
      setSave(s);
      onRefresh();
    } else {
      sfx.wrong();
      setMsg("เหรียญไม่พอ! ไปเก็บเหรียญจากด่านหรือมินิเกมก่อนนะ");
    }
    window.setTimeout(() => setMsg(""), 2500);
  };

  const items = [
    { item: "mushroom" as const, icon: "🍄", name: "เห็ดฮีลเลือด", desc: "กดใช้ระหว่างด่าน เพิ่มหัวใจ 1 ดวง (สูงสุด 4)", price: 30 },
    { item: "star" as const, icon: "⭐", name: "ดาวป้องกัน", desc: "กันคำตอบผิดได้ฟรี 1 ครั้ง ไม่เสียหัวใจ", price: 50 },
    { item: "hint" as const, icon: "🧪", name: "ยาใบ้", desc: "ตัดตัวเลือกผิด 2 ข้อในโจทย์ที่กำลังทำ", price: 20 },
  ];

  return (
    <div className="pixel-card mb-4 bg-[#fff8e7] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-pixel text-[11px] text-amber-700">🛒 ร้านค้าไอเทม</p>
        <span className="ml-auto rounded-sm border-2 border-amber-700 bg-amber-300 px-3 py-1 text-sm font-extrabold text-amber-900">
          🪙 เหรียญของคุณ: {save.stats.coins}
        </span>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {items.map((it) => (
          <div key={it.item} className="rounded-sm border-4 border-[#23273a] bg-white p-3">
            <p className="text-2xl">{it.icon} <span className="text-sm font-extrabold">{it.name}</span> <span className="text-xs font-bold text-slate-500">(มี {save.inv[it.item]})</span></p>
            <p className="mt-1 min-h-[2.5rem] text-xs font-medium text-slate-600">{it.desc}</p>
            <button
              type="button"
              onClick={() => buy(it.item, it.price, it.name)}
              className="pixel-btn mt-2 w-full rounded-sm bg-yellow-400 px-3 py-2 text-xs font-extrabold text-[#23273a]"
            >
              ซื้อ 🪙 {it.price}
            </button>
          </div>
        ))}
      </div>
      {msg ? <p className="mt-2 text-center text-sm font-bold text-amber-800">{msg}</p> : null}
    </div>
  );
}

/** ตัวเลือกกระดับสำหรับโหมดตะลุยโจทย์ */
function QuizMode({ ch }: { ch: Chapter }) {
  const [level, setLevel] = useState<Diff | 0 | null>(null);
  if (level === null) {
    const opts = [
      { v: 0, label: "🎲 คละทุกระดับ", desc: "สุ่ม 10 ข้อจากทุกความยาก" },
      { v: 1, label: "🟢 ง่าย", desc: "เริ่มจากชีวิตจริง ปูความมั่นใจ" },
      { v: 2, label: "🟡 กลาง", desc: "ประยุกต์ 1 ขั้นตอน" },
      { v: 3, label: "🔴 ยาก", desc: "ประยุกต์ 2–3 ขั้น แนว A-Level" },
    ] as const;
    return (
      <div className="mx-auto max-w-2xl">
        <p className="mb-4 text-center font-pixel text-[11px] leading-5 text-[#23273a]">เลือกระดับความยาก 🎯</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {opts.map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => {
                sfx.click();
                setLevel(o.v);
              }}
              className="pixel-card bg-white p-4 text-left transition hover:-translate-y-1"
            >
              <p className="text-lg font-extrabold">{o.label}</p>
              <p className="mt-1 text-sm text-slate-600">{o.desc}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }
  return <QuizRunner chapter={ch} level={level} />;
}

function PlayInner({ chId }: { chId: string }) {
  const search = useSearchParams();
  const mode = search.get("mode") ?? "game";
  const ch = getChapter(chId);
  const [, force] = useState(0);
  useEffect(() => force((x) => x + 1), []);

  if (!ch) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="font-pixel text-sm">ไม่พบบทเรียนนี้ 😢</p>
        <Link href="/select" className="pixel-btn mt-6 inline-block rounded-sm bg-yellow-400 px-6 py-3 font-pixel text-xs text-[#23273a]">← กลับหน้าเลือกชั้น</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link href={`/chapter/${ch.id}/mode`} className="pixel-btn rounded-sm bg-white px-3 py-2 text-sm font-bold text-[#23273a]">← โหมด</Link>
        <h1 className="font-pixel text-[11px] leading-5 text-[#23273a] sm:text-sm">
          {ch.emoji} {ch.short}
        </h1>
        <span className="ml-auto rounded-sm border-2 border-[#23273a] bg-white px-2 py-1 text-xs font-bold">
          {mode === "game" ? "🍄 ด่านมาริโอ" : mode === "mini" ? `🕹️ ${ch.mini.title}` : mode === "quiz" ? "🎯 ตะลุยโจทย์" : "🐲 บอสใหญ่"}
        </span>
      </div>

      {mode === "game" ? (
        <>
          <Shop onRefresh={() => force((x) => x + 1)} />
          <GameCanvas chapter={ch} />
        </>
      ) : mode === "mini" ? (
        <MiniGameRunner game={ch.mini} chId={ch.id} chapterName={ch.short} />
      ) : mode === "quiz" ? (
        <QuizMode ch={ch} />
      ) : (
        <BossBattle chapter={ch} />
      )}
    </main>
  );
}

export default function PlayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense
      fallback={
        <main className="py-20 text-center">
          <p className="font-pixel text-xs text-[#23273a]">กำลังโหลดด่าน...</p>
        </main>
      }
    >
      <PlayInner chId={id} />
    </Suspense>
  );
}
