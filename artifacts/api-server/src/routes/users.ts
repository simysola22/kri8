import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq, or, ilike, sql } from "drizzle-orm";

const router = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" }); return;
  }
  req.clerkUserId = userId;
  next();
};

// Upsert user from Clerk data
async function getOrCreateUser(clerkUserId: string, email: string, name?: string) {
  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkUserId, clerkUserId))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const [newUser] = await db
    .insert(usersTable)
    .values({ clerkUserId, email: email || "", name: name || null })
    .returning();

  return newUser;
}

// GET /api/users/me
router.get("/me", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const auth = getAuth(req);
    const clerkUserId = auth?.userId!;

    // Get email from Clerk session claims
    const email = (auth?.sessionClaims?.email as string) || "";
    const name = (auth?.sessionClaims?.name as string) || undefined;

    const user = await getOrCreateUser(clerkUserId, email, name);

    res.json({
      id: user.id,
      clerkUserId: user.clerkUserId,
      email: user.email,
      name: user.name,
      username: user.username,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      isPublic: user.isPublic,
      themePreference: user.themePreference,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get user");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/users/me
router.patch("/me", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const clerkUserId = req.clerkUserId;
    // Find user first
    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerkUserId, clerkUserId))
      .limit(1);

    if (!existing.length) {
      res.status(404).json({ error: "User not found" }); return;
    }

    const { name, username, themePreference, bio, avatarUrl, isPublic } = req.body;
    const updates: Partial<typeof usersTable.$inferInsert> = {};
    if (name !== undefined) updates.name = name;
    if (username !== undefined) updates.username = username;
    if (bio !== undefined) updates.bio = bio;
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
    if (isPublic !== undefined) updates.isPublic = isPublic;
    if (themePreference !== undefined) updates.themePreference = themePreference;

    const [updated] = await db
      .update(usersTable)
      .set(updates)
      .where(eq(usersTable.clerkUserId, clerkUserId))
      .returning();

    res.json({
      id: updated.id,
      clerkUserId: updated.clerkUserId,
      email: updated.email,
      name: updated.name,
      username: updated.username,
      bio: updated.bio,
      avatarUrl: updated.avatarUrl,
      isPublic: updated.isPublic,
      themePreference: updated.themePreference,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update user");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/users/search?q=
router.get("/search", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const q = String(req.query.q ?? "").trim();
    if (!q || q.length < 2) { res.json([]); return; }

    const users = await db
      .select()
      .from(usersTable)
      .where(or(ilike(usersTable.name, `%${q}%`), ilike(usersTable.username, `%${q}%`)))
      .limit(20);

    res.json(users.map(u => ({
      id: u.id,
      name: u.name,
      username: u.username,
      bio: u.bio,
      avatarUrl: u.avatarUrl,
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to search users");
    res.status(500).json({ error: "Internal error" });
  }
});

export { requireAuth, getOrCreateUser };
export default router;
