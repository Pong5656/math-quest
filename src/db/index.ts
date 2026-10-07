import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const globalForDb = globalThis as typeof globalThis & {
  __mathNextJsPostgresqlPool?: Pool;
};

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/**
 * Lazy connection: สร้าง Pool เฉพาะเมื่อมี DATABASE_URL เท่านั้น
 * ทำให้ Deploy ได้โดยไม่ต้องมีฐานข้อมูล (API จะตอบ 503 ชั่วคราว)
 * เปิดใช้เต็มรูปแบบ: เพิ่ม DATABASE_URL (Vercel Postgres / Neon) แล้วรัน `npx drizzle-kit push`
 */
export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  if (!globalForDb.__mathNextJsPostgresqlPool) {
    globalForDb.__mathNextJsPostgresqlPool = new Pool({ connectionString: url });
  }
  return drizzle(globalForDb.__mathNextJsPostgresqlPool);
}