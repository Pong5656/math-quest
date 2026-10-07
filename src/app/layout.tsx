import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "MATH QUEST — ผจญภัยคณิตศาสตร์ 8 บิต",
  description:
    "เกมมาริโอ 8 บิต ฝึกคณิตศาสตร์เพิ่มเติม ม.4–ม.6 ตามหลักสูตร สสวท. (ปรับปรุง 2560) และ Project 14",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Prompt:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="sky-bg min-h-screen font-thai text-slate-900 antialiased">
        <NavBar />
        {children}
        <footer className="mt-16 border-t-8 border-[#23273a] bg-[#23273a] py-8 text-center">
          <p className="font-pixel text-[10px] leading-5 text-yellow-300">MATH QUEST 8-BIT</p>
          <p className="mt-2 text-sm text-slate-300">
            คณิตศาสตร์เพิ่มเติม ม.4–ม.6 · อิงหลักสูตร สสวท. แกนกลาง 2551 (ปรับปรุง 2560) · โครงการ 14
          </p>
        </footer>
      </body>
    </html>
  );
}
