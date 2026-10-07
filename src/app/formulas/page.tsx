"use client";

// ===== คลังสูตร: ค้นหา + กรองตามบท + วิธีจำ + พิสูจน์ย่อ + ตัวอย่าง =====

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { Formula } from "@/lib/types";
import { ALL_CHAPTERS } from "@/data";
import MathText from "@/components/MathText";

function FormulaCard({ f, chTitle, chEmoji }: { f: Formula; chTitle: string; chEmoji: string }) {
  return (
    <div className="pixel-card flex h-full flex-col bg-white p-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">{chEmoji}</span>
        <p className="text-xs font-bold text-slate-500">{chTitle}</p>
      </div>
      <p className="mt-2 text-base font-extrabold">{f.name}</p>
      {/* สูตรหลักในกล่องเหลือง */}
      <div className="formula-box mt-2 overflow-x-auto rounded-sm px-3 py-2.5 text-center">
        <MathText text={`$$${f.latex}$$`} />
      </div>
      <div className="mt-3 space-y-2 text-sm">
        <div className="rounded-sm border-2 border-green-700 bg-green-100 px-3 py-2">
          <p className="text-xs font-extrabold text-green-800">🧠 วิธีจำ</p>
          <p className="mt-0.5 font-medium"><MathText text={f.memory} /></p>
        </div>
        <div className="rounded-sm border-2 border-sky-700 bg-sky-100 px-3 py-2">
          <p className="text-xs font-extrabold text-sky-800">🔍 พิสูจน์ย่อ</p>
          <p className="mt-0.5 font-medium"><MathText text={f.proof} /></p>
        </div>
        <div className="rounded-sm border-2 border-amber-700 bg-amber-100 px-3 py-2">
          <p className="text-xs font-extrabold text-amber-800">✏️ ตัวอย่าง</p>
          <p className="mt-0.5 font-medium"><MathText text={f.example} /></p>
          <p className="mt-1 text-xs font-bold text-amber-900">เฉลย: <MathText text={f.ans} /></p>
        </div>
      </div>
    </div>
  );
}

export default function FormulasPage() {
  const [query, setQuery] = useState("");
  const [chFilter, setChFilter] = useState("all");

  const cards = useMemo(() => {
    const out: { f: Formula; chTitle: string; chEmoji: string; chId: string }[] = [];
    for (const ch of ALL_CHAPTERS) {
      if (chFilter !== "all" && ch.id !== chFilter) continue;
      for (const f of ch.formulas) {
        const text = `${f.name} ${f.latex} ${f.memory} ${f.proof} ${f.example} ${ch.title}`.toLowerCase();
        if (query.trim() === "" || text.includes(query.trim().toLowerCase())) {
          out.push({ f, chTitle: `${ch.grade} ล.${ch.book} · ${ch.short}`, chEmoji: ch.emoji, chId: ch.id });
        }
      }
    }
    return out;
  }, [query, chFilter]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-center font-pixel text-sm leading-6 text-[#23273a] sm:text-lg">📜 คลังสูตรคณิตศาสตร์</h1>
      <p className="mt-2 text-center text-sm font-medium text-slate-700">
        ครบทุกบท ม.4–ม.6 — ทุกสูตรมีวิธีจำ (mnemonic) พิสูจน์ย่อ และตัวอย่าง 1 ข้อ
      </p>

      {/* แถบค้นหาและกรอง */}
      <div className="pixel-card mt-6 flex flex-col gap-3 bg-[#fff8e7] p-4 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔎 ค้นหาสูตร เช่น ไซน์, ลิมิต, det, ครึ่งชีวิต..."
          className="w-full rounded-sm border-4 border-[#23273a] bg-white px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-yellow-300"
        />
        <select
          value={chFilter}
          onChange={(e) => setChFilter(e.target.value)}
          className="rounded-sm border-4 border-[#23273a] bg-white px-3 py-2.5 text-sm font-bold"
        >
          <option value="all">ทุกบท</option>
          {ALL_CHAPTERS.map((ch) => (
            <option key={ch.id} value={ch.id}>
              {ch.grade} ล.{ch.book} — {ch.short}
            </option>
          ))}
        </select>
      </div>

      <p className="mt-4 text-sm font-bold text-slate-700">พบ {cards.length} สูตร</p>

      <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((c, i) => (
          <motion.div key={`${c.chId}-${c.f.name}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.4) }}>
            <FormulaCard f={c.f} chTitle={c.chTitle} chEmoji={c.chEmoji} />
          </motion.div>
        ))}
      </div>

      {cards.length === 0 ? (
        <div className="pixel-card mx-auto mt-8 max-w-md bg-white p-6 text-center">
          <p className="text-3xl">🔍</p>
          <p className="mt-2 font-bold">ไม่พบสูตรที่ค้นหา ลองเปลี่ยนคำหรือเลือกบทใหม่ดูนะ</p>
        </div>
      ) : null}
    </main>
  );
}
