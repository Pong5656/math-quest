"use client";
// คอมโพเนนต์แสดงข้อความภาษาไทยปนสมการคณิตศาสตร์ด้วย KaTeX
import katex from "katex";
import { Fragment, type ReactNode } from "react";

/** แปลง LaTeX เป็น HTML (จัดการ error อย่างนุ่มนวล) */
function tex(src: string, display = false): string {
  try {
    return katex.renderToString(src, { displayMode: display, throwOnError: false, strict: false });
  } catch {
    return `<span class="text-[#fbd000]">${src}</span>`;
  }
}

/**
 * MathText — รับข้อความที่มีสัญลักษณ์
 *  \[ ... \] หรือ $$ ... $$  = สมการแสดงผลกลางบรรทัด
 *  \( ... \) หรือ $ ... $    = สมการในบรรทัด
 */
export default function MathText({ children, className = "" }: { children: string; className?: string }) {
  const parts: ReactNode[] = [];
  // แยกก้อนสมการออกจากข้อความปกติ
  const re = /(\\\[[\s\S]+?\\\]|\$\$[\s\S]+?\$\$|\\\([\s\S]+?\\\)|\$[^$\n]+?\$)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(children)) !== null) {
    if (m.index > last) parts.push(<Fragment key={`t${k++}`}>{children.slice(last, m.index)}</Fragment>);
    const raw = m[0];
    const display = raw.startsWith("\\[") || raw.startsWith("$$");
    const body = raw.slice(display ? 2 : 2, raw.length - 2);
    parts.push(
      <span
        key={`m${k++}`}
        className={display ? "my-1 block overflow-x-auto text-center" : "inline"}
        dangerouslySetInnerHTML={{ __html: tex(body, display) }}
      />,
    );
    last = m.index + raw.length;
  }
  if (last < children.length) parts.push(<Fragment key={`t${k++}`}>{children.slice(last)}</Fragment>);
  return <span className={className}>{parts}</span>;
}

/** แสดงสมการเดี่ยว ๆ แบบ display mode */
export function MathBlock({ tex: src }: { tex: string }) {
  return <div dangerouslySetInnerHTML={{ __html: tex(src, true) }} />;
}
