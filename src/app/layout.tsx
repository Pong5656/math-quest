import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import TopNav from "@/components/TopNav";

export const metadata: Metadata = {
  title: "MATH QUEST — ผจญภัยคณิตศาสตร์ 8-Bit",
  description:
    "เกมการเรียนรู้คณิตศาสตร์เพิ่มเติม ม.ปลาย (ม.4–ม.6) สไตล์มาริโอ 8-Bit อิง สสวท. หลักสูตรแกนกลาง พ.ศ. 2551 (ปรับปรุง 2560) และ Project 14",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0b0620",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th">
      <head>
        {/* ฟอนต์ Press Start 2P (หัวข้อ/ตัวเลข) + Prompt (เนื้อหาไทย) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Prompt:wght@300;400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#0b0620] text-white antialiased">
        <TopNav />
        <main className="mx-auto w-full max-w-6xl px-3 pb-24 pt-4 sm:px-6">{children}</main>
        <footer className="border-t-4 border-[#1a1030] bg-[#120a26] py-6 text-center text-xs text-white/60">
          <p className="font-pixel text-[10px] text-[#fbd000]">MATH QUEST 8-BIT</p>
          <p className="mt-2 px-4">
            เนื้อหาอิง สสวท. หลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน พ.ศ. 2551 (ปรับปรุง พ.ศ. 2560) รายวิชาคณิตศาสตร์เพิ่มเติม ม.4–ม.6 และ Project 14
          </p>
        </footer>
      </body>
    </html>
  );
}
