import { pgTable, serial, text, timestamp, boolean, integer, date, index } from "drizzle-orm/pg-core";
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
}, (table) => [
  // Primary list query: userId + sort by createdAt
  index("idx_ideas_user_created").on(table.userId, table.createdAt),
  // Filter by isUsed status per user
  index("idx_ideas_user_used").on(table.userId, table.isUsed),
  // Branch lookups: find children of a parent idea
  index("idx_ideas_parent").on(table.parentIdeaId),
  // Calendar date range queries
  index("idx_ideas_custom_date").on(table.userId, table.customDate),
  index("idx_ideas_used_date").on(table.userId, table.usedDate),
  // Auto-mark-used: find pending ideas with past customDate
  index("idx_ideas_automark").on(table.userId, table.isUsed, table.customDate),
]);

export const insertIdeaSchema = createInsertSchema(ideasTable).omit({
  id: true,
  branchCount: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertIdea = z.infer<typeof insertIdeaSchema>;
export type Idea = typeof ideasTable.$inferSelect;
