"use client";

// ===== ตัวเรนเดอร์ข้อความปนสมการ KaTeX =====
// ข้อความที่ครอบด้วย $...$ จะถูกเรนเดอร์เป็นสูตรคณิตศาสตร์
// ข้อความที่ครอบด้วย $$...$$ จะเรนเดอร์แบบบรรทัดกลาง

import katex from "katex";
import "katex/dist/katex.min.css";

function renderTex(tex: string, display: boolean): string {
  try {
    return katex.renderToString(tex, { throwOnError: false, displayMode: display });
  } catch {
    return tex;
  }
}

export default function MathText({ text, className }: { text: string; className?: string }) {
  // แยกก้อน $$...$$ และ $...$ ออกจากข้อความปกติ
  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g).filter((p) => p !== "");
  return (
    <span className={className}>
      {parts.map((p, i) => {
        if (p.startsWith("$$") && p.endsWith("$$")) {
          return (
            <span
              key={i}
              className="my-1 block overflow-x-auto text-center"
              dangerouslySetInnerHTML={{ __html: renderTex(p.slice(2, -2), true) }}
            />
          );
        }
        if (p.startsWith("$") && p.endsWith("$")) {
          return <span key={i} dangerouslySetInnerHTML={{ __html: renderTex(p.slice(1, -1), false) }} />;
        }
        return <span key={i}>{p}</span>;
      })}
    </span>
  );
}
