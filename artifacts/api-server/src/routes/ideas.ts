import { Router } from "express";

import { db, usersTable, ideasTable } from "@workspace/db";
import { eq, and, isNull, sql, desc, ilike, or, lte, gt } from "drizzle-orm";
import { z } from "zod";
import { requireAuth, getOrCreateUser } from "./users";
import { validateBody } from "../middlewares/validate";

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

// Replace N+1 recursive fetch with a single recursive CTE
async function getBranchesFlat(ideaId: number): Promise<ReturnType<typeof serializeIdea>[]> {
  const result = await db.execute(sql`
    WITH RECURSIVE branch_tree AS (
      SELECT * FROM ideas WHERE parent_idea_id = ${ideaId}
      UNION ALL
      SELECT i.* FROM ideas i
      INNER JOIN branch_tree bt ON i.parent_idea_id = bt.id
    )
    SELECT * FROM branch_tree ORDER BY created_at ASC
  `);
  return result.rows.map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    insight: row.insight ?? null,
    origin: row.origin ?? null,
    notes: row.notes ?? null,
    videoEditingNotes: row.video_editing_notes ?? null,
    createdDate: row.created_date,
    usedDate: row.used_date ?? null,
    customDate: row.custom_date ?? null,
    isUsed: row.is_used,
    parentIdeaId: row.parent_idea_id ?? null,
    branchCount: row.branch_count ?? 0,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }));
}

// Per-user autoMarkUsed cooldown (in-memory, resets on server restart)
const autoMarkCooldown = new Map<number, number>();
const AUTO_MARK_INTERVAL_MS = 60_000; // run at most once per minute per user

async function autoMarkUsed(userId: number) {
  const last = autoMarkCooldown.get(userId) ?? 0;
  if (Date.now() - last < AUTO_MARK_INTERVAL_MS) return;
  autoMarkCooldown.set(userId, Date.now());

  const today = new Date().toISOString().split("T")[0];
  await db
    .update(ideasTable)
    .set({ isUsed: true, usedDate: today, updatedAt: new Date() })
    .where(
      and(
        eq(ideasTable.userId, userId),
        eq(ideasTable.isUsed, false),
        sql`${ideasTable.customDate} IS NOT NULL`,
        lte(ideasTable.customDate, today),
      ),
    );
}

// Validation schemas
const createIdeaSchema = z.object({
  title: z.string().min(1).max(500),
  insight: z.string().max(2000).optional(),
  origin: z.string().max(500).optional(),
  notes: z.string().max(10000).optional(),
  videoEditingNotes: z.string().max(10000).optional(),
  customDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const updateIdeaSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  insight: z.string().max(2000).nullable().optional(),
  origin: z.string().max(500).nullable().optional(),
  notes: z.string().max(10000).nullable().optional(),
  videoEditingNotes: z.string().max(10000).nullable().optional(),
  customDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  usedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  isUsed: z.boolean().optional(),
});

const createBranchSchema = z.object({
  title: z.string().min(1).max(500),
  insight: z.string().max(2000).optional(),
  notes: z.string().max(10000).optional(),
  videoEditingNotes: z.string().max(10000).optional(),
});

// GET /api/ideas — paginated, DB-level search and filter
router.get("/", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const clerkUserId = req.clerkUserId as string;
    const user = await getOrCreateUser(clerkUserId, "");

    // Throttled auto-mark — runs at most once per minute per user
    autoMarkUsed(user.id).catch(() => {});

    const { search, is_used, parent_id } = req.query;
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 200);
    const cursor = req.query.cursor ? parseInt(req.query.cursor as string) : undefined;

    const conditions: ReturnType<typeof eq>[] = [eq(ideasTable.userId, user.id) as any];

    if (is_used !== undefined) {
      conditions.push(eq(ideasTable.isUsed, is_used === "true") as any);
    }
    if (parent_id === "null" || parent_id === "") {
      conditions.push(isNull(ideasTable.parentIdeaId) as any);
    } else if (parent_id !== undefined && parent_id !== null) {
      conditions.push(eq(ideasTable.parentIdeaId, parseInt(parent_id as string)) as any);
    }

    // Push search down to DB — avoids fetching all rows
    if (search && typeof search === "string" && search.trim()) {
      const pattern = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(ideasTable.title, pattern),
          ilike(ideasTable.insight, pattern),
          ilike(ideasTable.notes, pattern),
        ) as any,
      );
    }

    // Cursor-based pagination using idea id
    if (cursor) {
      conditions.push(lte(ideasTable.id, cursor) as any);
    }

    const ideas = await db
      .select()
      .from(ideasTable)
      .where(and(...(conditions as any[])))
      .orderBy(desc(ideasTable.id))
      .limit(limit);

    res.json(ideas.map(serializeIdea));
  } catch (err) {
    req.log.error({ err }, "Failed to list ideas");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/ideas
router.post("/", requireAuth, validateBody(createIdeaSchema), async (req: any, res): Promise<void> => {
  try {
    const clerkUserId = req.clerkUserId as string;
    const user = await getOrCreateUser(clerkUserId, "");

    const { title, insight, origin, notes, videoEditingNotes, customDate } = req.body;
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

// GET /api/ideas/stats — push aggregates to SQL
router.get("/stats", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const clerkUserId = req.clerkUserId as string;
    const user = await getOrCreateUser(clerkUserId, "");

    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const statsResult = await db.execute(sql`
      SELECT
        COUNT(*)::int                                              AS total,
        COUNT(*) FILTER (WHERE is_used = true)::int               AS used,
        COUNT(*) FILTER (WHERE is_used = false)::int              AS unused,
        COUNT(*) FILTER (WHERE branch_count > 0)::int             AS with_branches,
        COALESCE(SUM(branch_count), 0)::int                       AS total_branches,
        COUNT(*) FILTER (WHERE created_date >= ${weekAgo})::int   AS created_this_week,
        COUNT(*) FILTER (WHERE created_date >= ${monthAgo})::int  AS created_this_month
      FROM ideas
      WHERE user_id = ${user.id}
    `);

    const row = (statsResult.rows[0] as any) ?? {};
    res.json({
      total: row.total ?? 0,
      used: row.used ?? 0,
      unused: row.unused ?? 0,
      withBranches: row.with_branches ?? 0,
      totalBranches: row.total_branches ?? 0,
      createdThisWeek: row.created_this_week ?? 0,
      createdThisMonth: row.created_this_month ?? 0,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/ideas/recent
router.get("/recent", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const clerkUserId = req.clerkUserId as string;
    const user = await getOrCreateUser(clerkUserId, "");

    const limit = Math.min(parseInt(req.query.limit as string) || 5, 20);

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

// GET /api/ideas/calendar?month=YYYY-MM
router.get("/calendar", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const clerkUserId = req.clerkUserId as string;
    const user = await getOrCreateUser(clerkUserId, "");

    const month = String(req.query.month ?? "");
    if (!/^\d{4}-\d{2}$/.test(month)) {
      res.status(400).json({ error: "month must be YYYY-MM" }); return;
    }

    const [year, mo] = month.split("-").map(Number);
    const start = `${year}-${String(mo).padStart(2, "0")}-01`;
    const endDate = new Date(year, mo, 0);
    const end = endDate.toISOString().split("T")[0];

    const ideas = await db
      .select()
      .from(ideasTable)
      .where(
        and(
          eq(ideasTable.userId, user.id),
          sql`(
            (${ideasTable.createdDate} >= ${start} AND ${ideasTable.createdDate} <= ${end})
            OR (${ideasTable.usedDate} >= ${start} AND ${ideasTable.usedDate} <= ${end})
            OR (${ideasTable.customDate} >= ${start} AND ${ideasTable.customDate} <= ${end})
          )`,
        ),
      )
      .orderBy(desc(ideasTable.createdAt));

    res.json(ideas.map(serializeIdea));
  } catch (err) {
    req.log.error({ err }, "Failed to get calendar ideas");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/ideas/:id
router.get("/:id", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const clerkUserId = req.clerkUserId as string;
    const user = await getOrCreateUser(clerkUserId, "");

    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid idea id" }); return; }

    const ideas = await db
      .select()
      .from(ideasTable)
      .where(and(eq(ideasTable.id, id), eq(ideasTable.userId, user.id)))
      .limit(1);

    if (!ideas.length) {
      res.status(404).json({ error: "Idea not found" }); return;
    }

    const idea = ideas[0];
    const branches = await getBranchesFlat(idea.id);

    res.json({ ...serializeIdea(idea), branches });
  } catch (err) {
    req.log.error({ err }, "Failed to get idea");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/ideas/:id
router.patch("/:id", requireAuth, validateBody(updateIdeaSchema), async (req: any, res): Promise<void> => {
  try {
    const clerkUserId = req.clerkUserId as string;
    const user = await getOrCreateUser(clerkUserId, "");

    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid idea id" }); return; }

    const existing = await db
      .select({ id: ideasTable.id })
      .from(ideasTable)
      .where(and(eq(ideasTable.id, id), eq(ideasTable.userId, user.id)))
      .limit(1);

    if (!existing.length) {
      res.status(404).json({ error: "Idea not found" }); return;
    }

    const { title, insight, origin, notes, videoEditingNotes, customDate, usedDate, isUsed } = req.body;

    const updates: Partial<typeof ideasTable.$inferInsert> & { updatedAt?: Date } = { updatedAt: new Date() };
    if (title !== undefined) updates.title = title;
    if (insight !== undefined) updates.insight = insight ?? null;
    if (origin !== undefined) updates.origin = origin ?? null;
    if (notes !== undefined) updates.notes = notes ?? null;
    if (videoEditingNotes !== undefined) updates.videoEditingNotes = videoEditingNotes ?? null;
    if (customDate !== undefined) updates.customDate = customDate ?? null;
    if (usedDate !== undefined) updates.usedDate = usedDate ?? null;
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
    const clerkUserId = req.clerkUserId as string;
    const user = await getOrCreateUser(clerkUserId, "");

    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid idea id" }); return; }

    const existing = await db
      .select({ id: ideasTable.id, parentIdeaId: ideasTable.parentIdeaId })
      .from(ideasTable)
      .where(and(eq(ideasTable.id, id), eq(ideasTable.userId, user.id)))
      .limit(1);

    if (!existing.length) {
      res.status(404).json({ error: "Idea not found" }); return;
    }

    // Delete this idea and all descendants in one CTE
    await db.execute(sql`
      WITH RECURSIVE to_delete AS (
        SELECT id FROM ideas WHERE id = ${id}
        UNION ALL
        SELECT i.id FROM ideas i
        INNER JOIN to_delete td ON i.parent_idea_id = td.id
      )
      DELETE FROM ideas WHERE id IN (SELECT id FROM to_delete)
    `);

    // Decrement parent branch count
    if (existing[0].parentIdeaId) {
      await db
        .update(ideasTable)
        .set({ branchCount: sql`GREATEST(${ideasTable.branchCount} - 1, 0)`, updatedAt: new Date() })
        .where(eq(ideasTable.id, existing[0].parentIdeaId));
    }

    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete idea");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/ideas/:id/branches
router.get("/:id/branches", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const clerkUserId = req.clerkUserId as string;
    const user = await getOrCreateUser(clerkUserId, "");

    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid idea id" }); return; }

    const branches = await getBranchesFlat(id);
    res.json(branches);
  } catch (err) {
    req.log.error({ err }, "Failed to list branches");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/ideas/:id/branches
router.post("/:id/branches", requireAuth, validateBody(createBranchSchema), async (req: any, res): Promise<void> => {
  try {
    const clerkUserId = req.clerkUserId as string;
    const user = await getOrCreateUser(clerkUserId, "");

    const parentId = parseInt(req.params.id);
    if (isNaN(parentId)) { res.status(400).json({ error: "Invalid idea id" }); return; }

    const { title, insight, notes, videoEditingNotes } = req.body;

    const parent = await db
      .select({ id: ideasTable.id })
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

    await db
      .update(ideasTable)
      .set({ branchCount: sql`${ideasTable.branchCount} + 1`, updatedAt: new Date() })
      .where(eq(ideasTable.id, parentId));

    res.status(201).json(serializeIdea(branch));
  } catch (err) {
    req.log.error({ err }, "Failed to create branch");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/ideas/:id/mark-used
router.post("/:id/mark-used", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const clerkUserId = req.clerkUserId as string;
    const user = await getOrCreateUser(clerkUserId, "");

    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid idea id" }); return; }

    const { usedDate } = req.body;
    const today = new Date().toISOString().split("T")[0];

    const [updated] = await db
      .update(ideasTable)
      .set({ isUsed: true, usedDate: usedDate || today, updatedAt: new Date() })
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

export default router;
