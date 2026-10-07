"use client";
// RichText — แสดงข้อความไทยที่รองรับ **ตัวหนา** และสมการ KaTeX ในบรรทัดเดียวกัน
import MathText from "@/lib/math";
import { Fragment } from "react";

export default function RichText({ text, className = "" }: { text: string; className?: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <b key={i} className="font-bold text-[#0b0620]">
              <MathText>{part.slice(2, -2)}</MathText>
            </b>
          );
        }
        return (
          <Fragment key={i}>
            <MathText>{part}</MathText>
          </Fragment>
        );
      })}
    </span>
  );
}
