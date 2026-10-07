import { pgTable, serial, text, integer, timestamp, varchar } from "drizzle-orm/pg-core";

/** ตารางสถิติผู้เล่นที่ส่งขึ้นเซิร์ฟเวอร์ (Leaderboard ของทั้งประเทศ) */
export const playerScores = pgTable("player_scores", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 40 }).notNull().default("นักเรียน"),
  chapterId: text("chapter_id").notNull(),
  mode: text("mode").notNull(), // game | minigame | quiz | boss
  score: integer("score").notNull().default(0),
  coins: integer("coins").notNull().default(0),
  correct: integer("correct").notNull().default(0),
  wrong: integer("wrong").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type PlayerScore = typeof playerScores.$inferSelect;
export type NewPlayerScore = typeof playerScores.$inferInsert;
