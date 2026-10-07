"use client";

// ===== องค์ประกอบ UI พิกเซลใช้ร่วมกัน =====

import type { ReactNode } from "react";
import { sfx } from "@/lib/sfx";
import type { Diff } from "@/lib/types";

/** ปุ่มพิกเซลสีสันต่าง ๆ */
export function PixelButton({
  children,
  onClick,
  color = "bg-yellow-400",
  className = "",
  disabled,
  href,
}: {
  children: ReactNode;
  onClick?: () => void;
  color?: string;
  className?: string;
  disabled?: boolean;
  href?: string;
}) {
  const cls = `pixel-btn inline-flex items-center justify-center gap-2 rounded-sm px-5 py-3 font-pixel text-[11px] leading-4 text-[#23273a] ${color} ${className}`;
  const handle = () => {
    sfx.click();
    onClick?.();
  };
  if (href && !disabled) {
    return (
      <a href={href} className={cls} onClick={() => sfx.click()}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={cls} onClick={handle} disabled={disabled}>
      {children}
    </button>
  );
}

/** หัวข้อส่วนสไตล์พิกเซล */
export function SectionTitle({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div className="mb-6 text-center">
      <h2 className="font-pixel text-sm leading-6 text-[#23273a] sm:text-lg">{children}</h2>
      {sub ? <p className="mt-2 text-sm font-medium text-slate-700 sm:text-base">{sub}</p> : null}
    </div>
  );
}

/**ป้ายระดับความยาก 🟢🟡🔴 */
export function DiffPill({ lv }: { lv: Diff }) {
  const map: Record<Diff, { txt: string; cls: string }> = {
    1: { txt: "🟢 ง่าย", cls: "bg-green-200 border-green-700" },
    2: { txt: "🟡 กลาง", cls: "bg-yellow-200 border-yellow-700" },
    3: { txt: "🔴 ยาก", cls: "bg-red-200 border-red-700" },
  };
  return (
    <span className={`inline-block rounded-sm border-2 px-2 py-0.5 text-xs font-bold ${map[lv].cls}`}>
      {map[lv].txt}
    </span>
  );
}

/** ป้ายชื่อโหมดสำหรับโจทย์/ด่าน */
export function CoinTag({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-sm border-2 border-amber-700 bg-amber-300 px-2 py-0.5 text-xs font-bold text-amber-900">
      🪙 +{n}
    </span>
  );
}
