import { pgTable, serial, text, timestamp, boolean, integer, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const ideasTable = pgTable("ideas", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  insight: text("insight"),
  origin: text("origin"),
  notes: text("notes"),
  videoEditingNotes: text("video_editing_notes"),
  createdDate: date("created_date").notNull(),
  usedDate: date("used_date"),
  customDate: date("custom_date"),
  isUsed: boolean("is_used").notNull().default(false),
  parentIdeaId: integer("parent_idea_id"),
  branchCount: integer("branch_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertIdeaSchema = createInsertSchema(ideasTable).omit({
  id: true,
  branchCount: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertIdea = z.infer<typeof insertIdeaSchema>;
export type Idea = typeof ideasTable.$inferSelect;
