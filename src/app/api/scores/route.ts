import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db";
import { playerScores } from "@/db/schema";

export const dynamic = "force-dynamic";

/**
 * กระดานคะแนน Leaderboard (PostgreSQL ผ่าน Drizzle)
 * ถ้ายังไม่ได้ตั้ง DATABASE_URL: แอปยังเล่นได้ครบ ฟีเจอร์นี้จะตอบ disabled
 * เปิดใช้: ตั้ง Env DATABASE_URL แล้วรัน `npx drizzle-kit push` (สร้างตาราง player_scores)
 */

/** GET /api/scores?chapterId=xxx — อ่านกระดานคะแนน (Leaderboard) */
export async function GET(req: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json({ ok: false, db: "not-configured", rows: [] }, { status: 503 });
  }
  try {
    const url = new URL(req.url);
    const chapterId = url.searchParams.get("chapterId");
    const rows = chapterId
      ? await getDb().select().from(playerScores).where(eq(playerScores.chapterId, chapterId)).orderBy(desc(playerScores.score)).limit(20)
      : await getDb().select().from(playerScores).orderBy(desc(playerScores.score)).limit(20);
    return NextResponse.json({ ok: true, rows });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e), rows: [] }, { status: 200 });
  }
}

/** POST /api/scores — บันทึกคะแนนขึ้นเซิร์ฟเวอร์ */
export async function POST(req: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json({ ok: false, db: "not-configured" }, { status: 503 });
  }
  try {
    const body = await req.json();
    const inserted = await getDb()
      .insert(playerScores)
      .values({
        name: String(body.name ?? "นักเรียน").slice(0, 40),
        chapterId: String(body.chapterId ?? ""),
        mode: String(body.mode ?? "game"),
        score: Number(body.score ?? 0),
        coins: Number(body.coins ?? 0),
        correct: Number(body.correct ?? 0),
        wrong: Number(body.wrong ?? 0),
      })
      .returning({ id: playerScores.id });
    return NextResponse.json({ ok: true, id: inserted[0]?.id ?? null });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 200 });
  }
}