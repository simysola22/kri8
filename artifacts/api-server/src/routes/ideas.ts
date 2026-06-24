import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable, ideasTable } from "@workspace/db";
import { eq, and, isNull, sql, like, or, desc, lte } from "drizzle-orm";
import { requireAuth, getOrCreateUser } from "./users";

const router = Router();

function serializeIdea(idea: typeof ideasTable.$inferSelect) {
  return {
    id: idea.id,
    userId: idea.userId,
    title: idea.title,
    insight: idea.insight,
    origin: idea.origin,
    notes: idea.notes,
    videoEditingNotes: idea.videoEditingNotes,
    createdDate: idea.createdDate,
    usedDate: idea.usedDate,
    customDate: idea.customDate,
    isUsed: idea.isUsed,
    parentIdeaId: idea.parentIdeaId,
    branchCount: idea.branchCount,
    createdAt: idea.createdAt.toISOString(),
    updatedAt: idea.updatedAt.toISOString(),
  };
}

async function getDbUserId(clerkUserId: string) {
  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkUserId, clerkUserId))
    .limit(1);
  return users[0]?.id;
}

// Recursively get all branches of an idea
async function getBranchesRecursive(ideaId: number): Promise<ReturnType<typeof serializeIdea>[]> {
  const branches = await db
    .select()
    .from(ideasTable)
    .where(eq(ideasTable.parentIdeaId, ideaId))
    .orderBy(ideasTable.createdAt);

  const result = [];
  for (const branch of branches) {
    result.push(serializeIdea(branch));
    const subBranches = await getBranchesRecursive(branch.id);
    result.push(...subBranches);
  }
  return result;
}

// Auto-mark ideas as used based on customDate
async function autoMarkUsed(userId: number) {
  const today = new Date().toISOString().split("T")[0];
  await db
    .update(ideasTable)
    .set({ isUsed: true, usedDate: today, updatedAt: new Date() })
    .where(
      and(
        eq(ideasTable.userId, userId),
        eq(ideasTable.isUsed, false),
        sql`${ideasTable.customDate} <= ${today}`,
        sql`${ideasTable.customDate} IS NOT NULL`,
      ),
    );
}

// GET /api/ideas
router.get("/", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const auth = getAuth(req);
    const clerkUserId = auth?.userId!;
    const email = (auth?.sessionClaims?.email as string) || "";
    const user = await getOrCreateUser(clerkUserId, email);

    await autoMarkUsed(user.id);

    const { search, is_used, parent_id } = req.query;

    let conditions = [eq(ideasTable.userId, user.id)];

    if (is_used !== undefined) {
      conditions.push(eq(ideasTable.isUsed, is_used === "true"));
    }

    if (parent_id === "null" || parent_id === "") {
      conditions.push(isNull(ideasTable.parentIdeaId));
    } else if (parent_id !== undefined) {
      conditions.push(eq(ideasTable.parentIdeaId, parseInt(parent_id as string)));
    }

    let ideas = await db
      .select()
      .from(ideasTable)
      .where(and(...conditions))
      .orderBy(desc(ideasTable.createdAt));

    if (search) {
      const q = (search as string).toLowerCase();
      ideas = ideas.filter(
        (idea) =>
          idea.title.toLowerCase().includes(q) ||
          (idea.insight && idea.insight.toLowerCase().includes(q)) ||
          (idea.notes && idea.notes.toLowerCase().includes(q)),
      );
    }

    res.json(ideas.map(serializeIdea));
  } catch (err) {
    req.log.error({ err }, "Failed to list ideas");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/ideas
router.post("/", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const auth = getAuth(req);
    const clerkUserId = auth?.userId!;
    const email = (auth?.sessionClaims?.email as string) || "";
    const user = await getOrCreateUser(clerkUserId, email);

    const { title, insight, origin, notes, videoEditingNotes, customDate } = req.body;

    if (!title) {
      res.status(400).json({ error: "Title is required" }); return;
    }

    const today = new Date().toISOString().split("T")[0];

    const [idea] = await db
      .insert(ideasTable)
      .values({
        userId: user.id,
        title,
        insight: insight || null,
        origin: origin || null,
        notes: notes || null,
        videoEditingNotes: videoEditingNotes || null,
        createdDate: today,
        customDate: customDate || null,
      })
      .returning();

    res.status(201).json(serializeIdea(idea));
  } catch (err) {
    req.log.error({ err }, "Failed to create idea");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/ideas/stats
router.get("/stats", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const auth = getAuth(req);
    const clerkUserId = auth?.userId!;
    const email = (auth?.sessionClaims?.email as string) || "";
    const user = await getOrCreateUser(clerkUserId, email);

    const allIdeas = await db
      .select()
      .from(ideasTable)
      .where(eq(ideasTable.userId, user.id));

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const total = allIdeas.length;
    const used = allIdeas.filter((i) => i.isUsed).length;
    const unused = total - used;
    const withBranches = allIdeas.filter((i) => i.branchCount > 0).length;
    const totalBranches = allIdeas.reduce((acc, i) => acc + i.branchCount, 0);
    const createdThisWeek = allIdeas.filter((i) => new Date(i.createdDate) >= weekAgo).length;
    const createdThisMonth = allIdeas.filter((i) => new Date(i.createdDate) >= monthAgo).length;

    res.json({ total, used, unused, withBranches, totalBranches, createdThisWeek, createdThisMonth });
  } catch (err) {
    req.log.error({ err }, "Failed to get stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/ideas/recent
router.get("/recent", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const auth = getAuth(req);
    const clerkUserId = auth?.userId!;
    const email = (auth?.sessionClaims?.email as string) || "";
    const user = await getOrCreateUser(clerkUserId, email);

    const limit = parseInt(req.query.limit as string) || 5;

    const ideas = await db
      .select()
      .from(ideasTable)
      .where(eq(ideasTable.userId, user.id))
      .orderBy(desc(ideasTable.createdAt))
      .limit(limit);

    res.json(ideas.map(serializeIdea));
  } catch (err) {
    req.log.error({ err }, "Failed to get recent ideas");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/ideas/:id
router.get("/:id", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const auth = getAuth(req);
    const clerkUserId = auth?.userId!;
    const email = (auth?.sessionClaims?.email as string) || "";
    const user = await getOrCreateUser(clerkUserId, email);

    const id = parseInt(req.params.id);

    const ideas = await db
      .select()
      .from(ideasTable)
      .where(and(eq(ideasTable.id, id), eq(ideasTable.userId, user.id)))
      .limit(1);

    if (!ideas.length) {
      res.status(404).json({ error: "Idea not found" }); return;
    }

    const idea = ideas[0];
    const branches = await getBranchesRecursive(idea.id);

    res.json({ ...serializeIdea(idea), branches });
  } catch (err) {
    req.log.error({ err }, "Failed to get idea");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/ideas/:id
router.patch("/:id", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const auth = getAuth(req);
    const clerkUserId = auth?.userId!;
    const email = (auth?.sessionClaims?.email as string) || "";
    const user = await getOrCreateUser(clerkUserId, email);

    const id = parseInt(req.params.id);

    const existing = await db
      .select()
      .from(ideasTable)
      .where(and(eq(ideasTable.id, id), eq(ideasTable.userId, user.id)))
      .limit(1);

    if (!existing.length) {
      res.status(404).json({ error: "Idea not found" }); return;
    }

    const { title, insight, origin, notes, videoEditingNotes, customDate, usedDate, isUsed } = req.body;

    const updates: Partial<typeof ideasTable.$inferInsert> & { updatedAt?: Date } = {
      updatedAt: new Date(),
    };
    if (title !== undefined) updates.title = title;
    if (insight !== undefined) updates.insight = insight || null;
    if (origin !== undefined) updates.origin = origin || null;
    if (notes !== undefined) updates.notes = notes || null;
    if (videoEditingNotes !== undefined) updates.videoEditingNotes = videoEditingNotes || null;
    if (customDate !== undefined) updates.customDate = customDate || null;
    if (usedDate !== undefined) updates.usedDate = usedDate || null;
    if (isUsed !== undefined) updates.isUsed = isUsed;

    const [updated] = await db
      .update(ideasTable)
      .set(updates)
      .where(eq(ideasTable.id, id))
      .returning();

    res.json(serializeIdea(updated));
  } catch (err) {
    req.log.error({ err }, "Failed to update idea");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/ideas/:id
router.delete("/:id", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const auth = getAuth(req);
    const clerkUserId = auth?.userId!;
    const email = (auth?.sessionClaims?.email as string) || "";
    const user = await getOrCreateUser(clerkUserId, email);

    const id = parseInt(req.params.id);

    const existing = await db
      .select()
      .from(ideasTable)
      .where(and(eq(ideasTable.id, id), eq(ideasTable.userId, user.id)))
      .limit(1);

    if (!existing.length) {
      res.status(404).json({ error: "Idea not found" }); return;
    }

    // Delete recursively (cascade via ON DELETE CASCADE on parent_idea_id would be ideal,
    // but we do it manually here for safety)
    async function deleteRecursive(ideaId: number) {
      const branches = await db
        .select({ id: ideasTable.id })
        .from(ideasTable)
        .where(eq(ideasTable.parentIdeaId, ideaId));

      for (const branch of branches) {
        await deleteRecursive(branch.id);
      }

      await db.delete(ideasTable).where(eq(ideasTable.id, ideaId));
    }

    await deleteRecursive(id);

    // Update parent branch count if applicable
    if (existing[0].parentIdeaId) {
      await db
        .update(ideasTable)
        .set({
          branchCount: sql`${ideasTable.branchCount} - 1`,
          updatedAt: new Date(),
        })
        .where(eq(ideasTable.id, existing[0].parentIdeaId));
    }

    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete idea");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/ideas/:id/mark-used
router.post("/:id/mark-used", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const auth = getAuth(req);
    const clerkUserId = auth?.userId!;
    const email = (auth?.sessionClaims?.email as string) || "";
    const user = await getOrCreateUser(clerkUserId, email);

    const id = parseInt(req.params.id);
    const { usedDate } = req.body;

    const today = new Date().toISOString().split("T")[0];

    const [updated] = await db
      .update(ideasTable)
      .set({
        isUsed: true,
        usedDate: usedDate || today,
        updatedAt: new Date(),
      })
      .where(and(eq(ideasTable.id, id), eq(ideasTable.userId, user.id)))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Idea not found" }); return;
    }

    res.json(serializeIdea(updated));
  } catch (err) {
    req.log.error({ err }, "Failed to mark idea as used");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/ideas/:id/branches
router.get("/:id/branches", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const auth = getAuth(req);
    const clerkUserId = auth?.userId!;
    const email = (auth?.sessionClaims?.email as string) || "";
    const user = await getOrCreateUser(clerkUserId, email);

    const id = parseInt(req.params.id);

    const branches = await getBranchesRecursive(id);
    res.json(branches);
  } catch (err) {
    req.log.error({ err }, "Failed to list branches");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/ideas/:id/branches
router.post("/:id/branches", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const auth = getAuth(req);
    const clerkUserId = auth?.userId!;
    const email = (auth?.sessionClaims?.email as string) || "";
    const user = await getOrCreateUser(clerkUserId, email);

    const parentId = parseInt(req.params.id);
    const { title, insight, notes, videoEditingNotes } = req.body;

    if (!title) {
      res.status(400).json({ error: "Title is required" }); return;
    }

    // Verify parent exists and belongs to user
    const parent = await db
      .select()
      .from(ideasTable)
      .where(and(eq(ideasTable.id, parentId), eq(ideasTable.userId, user.id)))
      .limit(1);

    if (!parent.length) {
      res.status(404).json({ error: "Parent idea not found" }); return;
    }

    const today = new Date().toISOString().split("T")[0];

    const [branch] = await db
      .insert(ideasTable)
      .values({
        userId: user.id,
        title,
        insight: insight || null,
        notes: notes || null,
        videoEditingNotes: videoEditingNotes || null,
        createdDate: today,
        parentIdeaId: parentId,
      })
      .returning();

    // Increment parent branch count
    await db
      .update(ideasTable)
      .set({
        branchCount: sql`${ideasTable.branchCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(ideasTable.id, parentId));

    res.status(201).json(serializeIdea(branch));
  } catch (err) {
    req.log.error({ err }, "Failed to create branch");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
