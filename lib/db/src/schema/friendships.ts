import { pgTable, serial, text, timestamp, integer, uniqueIndex, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const friendshipsTable = pgTable(
  "friendships",
  {
    id: serial("id").primaryKey(),
    requesterId: integer("requester_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    addresseeId: integer("addressee_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"), // pending | accepted | rejected
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("unique_friendship").on(table.requesterId, table.addresseeId),
    // Find all requests addressed to a user (pending requests inbox)
    index("idx_friendships_addressee_status").on(table.addresseeId, table.status),
    // Find all friendships for a user in either direction
    index("idx_friendships_requester").on(table.requesterId),
  ],
);

export const insertFriendshipSchema = createInsertSchema(friendshipsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
export type Friendship = typeof friendshipsTable.$inferSelect;
