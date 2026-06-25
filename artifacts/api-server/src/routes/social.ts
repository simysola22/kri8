import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable, friendshipsTable, messagesTable } from "@workspace/db";
import { eq, or, and, lt, desc, sql } from "drizzle-orm";

const router = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  req.clerkUserId = auth.userId;
  next();
};

async function getDbUser(clerkUserId: string) {
  const rows = await db.select().from(usersTable).where(eq(usersTable.clerkUserId, clerkUserId)).limit(1);
  return rows[0] ?? null;
}

function toPublic(u: typeof usersTable.$inferSelect) {
  return { id: u.id, name: u.name, username: u.username, bio: u.bio, avatarUrl: u.avatarUrl };
}

function toFriendRequest(row: typeof friendshipsTable.$inferSelect, requester: any, addressee: any) {
  return {
    id: row.id,
    requester: toPublic(requester),
    addressee: toPublic(addressee),
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

// GET /api/social/friends
router.get("/friends", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const me = await getDbUser(req.clerkUserId);
    if (!me) { res.status(401).json({ error: "User not found" }); return; }

    const rows = await db
      .select()
      .from(friendshipsTable)
      .where(or(eq(friendshipsTable.requesterId, me.id), eq(friendshipsTable.addresseeId, me.id)));

    const userIds = new Set<number>();
    for (const r of rows) { userIds.add(r.requesterId); userIds.add(r.addresseeId); }
    userIds.delete(me.id);

    const usersMap = new Map<number, typeof usersTable.$inferSelect>();
    if (userIds.size > 0) {
      const ids = [...userIds];
      const users = await db.select().from(usersTable).where(
        sql`${usersTable.id} = ANY(ARRAY[${sql.join(ids.map(id => sql`${id}`), sql`, `)}])`
      );
      for (const u of users) usersMap.set(u.id, u);
    }
    usersMap.set(me.id, me);

    const friends: ReturnType<typeof toPublic>[] = [];
    const pendingReceived: ReturnType<typeof toFriendRequest>[] = [];
    const pendingSent: ReturnType<typeof toFriendRequest>[] = [];

    for (const row of rows) {
      const requester = usersMap.get(row.requesterId);
      const addressee = usersMap.get(row.addresseeId);
      if (!requester || !addressee) continue;

      if (row.status === "accepted") {
        const partner = row.requesterId === me.id ? addressee : requester;
        friends.push(toPublic(partner));
      } else if (row.status === "pending") {
        const fr = toFriendRequest(row, requester, addressee);
        if (row.addresseeId === me.id) pendingReceived.push(fr);
        else pendingSent.push(fr);
      }
    }

    res.json({ friends, pendingReceived, pendingSent });
  } catch (err) {
    req.log.error({ err }, "Failed to list friends");
    res.status(500).json({ error: "Internal error" });
  }
});

// POST /api/social/friends/:userId
router.post("/friends/:userId", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const me = await getDbUser(req.clerkUserId);
    if (!me) { res.status(401).json({ error: "User not found" }); return; }

    const addresseeId = Number(req.params.userId);
    if (isNaN(addresseeId) || addresseeId === me.id) { res.status(400).json({ error: "Invalid user" }); return; }

    const addresseeRows = await db.select().from(usersTable).where(eq(usersTable.id, addresseeId)).limit(1);
    if (!addresseeRows[0]) { res.status(404).json({ error: "User not found" }); return; }

    const existing = await db.select().from(friendshipsTable).where(
      or(
        and(eq(friendshipsTable.requesterId, me.id), eq(friendshipsTable.addresseeId, addresseeId)),
        and(eq(friendshipsTable.requesterId, addresseeId), eq(friendshipsTable.addresseeId, me.id)),
      )
    ).limit(1);

    if (existing[0]) { res.status(409).json({ error: "Request already exists" }); return; }

    const [row] = await db.insert(friendshipsTable).values({
      requesterId: me.id,
      addresseeId,
      status: "pending",
    }).returning();

    res.status(201).json(toFriendRequest(row, me, addresseeRows[0]));
  } catch (err) {
    req.log.error({ err }, "Failed to send friend request");
    res.status(500).json({ error: "Internal error" });
  }
});

// PATCH /api/social/friends/:requestId/respond
router.patch("/friends/:requestId/respond", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const me = await getDbUser(req.clerkUserId);
    if (!me) { res.status(401).json({ error: "User not found" }); return; }

    const requestId = Number(req.params.requestId);
    const { status } = req.body as { status: "accepted" | "rejected" };
    if (!["accepted", "rejected"].includes(status)) { res.status(400).json({ error: "Invalid status" }); return; }

    const rows = await db.select().from(friendshipsTable).where(
      and(eq(friendshipsTable.id, requestId), eq(friendshipsTable.addresseeId, me.id), eq(friendshipsTable.status, "pending"))
    ).limit(1);

    if (!rows[0]) { res.status(404).json({ error: "Request not found" }); return; }

    const [updated] = await db.update(friendshipsTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(friendshipsTable.id, requestId))
      .returning();

    const requesterRows = await db.select().from(usersTable).where(eq(usersTable.id, updated.requesterId)).limit(1);
    res.json(toFriendRequest(updated, requesterRows[0]!, me));
  } catch (err) {
    req.log.error({ err }, "Failed to respond to friend request");
    res.status(500).json({ error: "Internal error" });
  }
});

// GET /api/social/messages/:userId
router.get("/messages/:userId", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const me = await getDbUser(req.clerkUserId);
    if (!me) { res.status(401).json({ error: "User not found" }); return; }

    const partnerId = Number(req.params.userId);
    const limit = Math.min(Number(req.query.limit ?? 50), 100);
    const before = req.query.before ? Number(req.query.before) : undefined;

    let query = db.select().from(messagesTable).where(
      or(
        and(eq(messagesTable.senderId, me.id), eq(messagesTable.receiverId, partnerId)),
        and(eq(messagesTable.senderId, partnerId), eq(messagesTable.receiverId, me.id)),
      )
    ).$dynamic();

    if (before) query = query.where(lt(messagesTable.id, before));

    const messages = await query.orderBy(desc(messagesTable.createdAt)).limit(limit);

    // Mark received messages as read
    await db.update(messagesTable)
      .set({ isRead: true })
      .where(and(eq(messagesTable.senderId, partnerId), eq(messagesTable.receiverId, me.id), eq(messagesTable.isRead, false)));

    res.json(messages.reverse().map(m => ({
      id: m.id,
      senderId: m.senderId,
      receiverId: m.receiverId,
      content: m.content,
      isRead: m.isRead,
      createdAt: m.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to get messages");
    res.status(500).json({ error: "Internal error" });
  }
});

// POST /api/social/messages/:userId
router.post("/messages/:userId", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const me = await getDbUser(req.clerkUserId);
    if (!me) { res.status(401).json({ error: "User not found" }); return; }

    const receiverId = Number(req.params.userId);
    const { content } = req.body as { content: string };
    if (!content?.trim()) { res.status(400).json({ error: "Content required" }); return; }

    const [msg] = await db.insert(messagesTable).values({
      senderId: me.id,
      receiverId,
      content: content.trim(),
      isRead: false,
    }).returning();

    res.status(201).json({
      id: msg.id,
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      content: msg.content,
      isRead: msg.isRead,
      createdAt: msg.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to send message");
    res.status(500).json({ error: "Internal error" });
  }
});

// GET /api/social/conversations
router.get("/conversations", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const me = await getDbUser(req.clerkUserId);
    if (!me) { res.status(401).json({ error: "User not found" }); return; }

    // Get last message per conversation partner using raw SQL for efficiency
    const rawConvos = await db.execute(sql`
      SELECT DISTINCT ON (partner_id)
        partner_id,
        id, sender_id, receiver_id, content, is_read, created_at,
        unread_count
      FROM (
        SELECT
          CASE WHEN sender_id = ${me.id} THEN receiver_id ELSE sender_id END AS partner_id,
          id, sender_id, receiver_id, content, is_read, created_at,
          COUNT(*) FILTER (WHERE receiver_id = ${me.id} AND is_read = false)
            OVER (PARTITION BY CASE WHEN sender_id = ${me.id} THEN receiver_id ELSE sender_id END)
            AS unread_count
        FROM messages
        WHERE sender_id = ${me.id} OR receiver_id = ${me.id}
        ORDER BY created_at DESC
      ) sub
      ORDER BY partner_id, created_at DESC
    `);

    const rows = rawConvos.rows as Array<{
      partner_id: number; id: number; sender_id: number; receiver_id: number;
      content: string; is_read: boolean; created_at: Date; unread_count: string;
    }>;

    const partnerIds = rows.map(r => r.partner_id);
    const partnerUsers = partnerIds.length > 0
      ? await db.select().from(usersTable).where(
          sql`${usersTable.id} = ANY(ARRAY[${sql.join(partnerIds.map(id => sql`${id}`), sql`, `)}])`
        )
      : [];

    const userMap = new Map(partnerUsers.map(u => [u.id, u]));

    res.json(rows.map(r => ({
      partner: toPublic(userMap.get(r.partner_id)!),
      lastMessage: {
        id: r.id, senderId: r.sender_id, receiverId: r.receiver_id,
        content: r.content, isRead: r.is_read, createdAt: new Date(r.created_at).toISOString(),
      },
      unreadCount: Number(r.unread_count ?? 0),
    })).filter(c => c.partner));
  } catch (err) {
    req.log.error({ err }, "Failed to list conversations");
    res.status(500).json({ error: "Internal error" });
  }
});

export default router;
