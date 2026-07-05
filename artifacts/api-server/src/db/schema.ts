import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const ideas = pgTable("ideas", {
  id: serial("id").primaryKey(),

  userId: text("user_id").notNull(),

  title: text("title").notNull(),

  insight: text("insight"),

  origin: text("origin"),

  createdAt: timestamp("created_at").defaultNow(),
});
