import { Router } from "express";
import { db, usersTable, ideasTable } from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";

const router = Router();

function serializePublicUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    name: user.name ?? null,
    username: user.username ?? null,
    bio: user.bio ?? null,
    avatarUrl: user.avatarUrl ?? null,
  };
}

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

async function getBranchesRecursive(ideaId: number): Promise<ReturnType<typeof serializeIdea>[]> {
  const branches = await db
    .select()
    .from(ideasTable)
    .where(eq(ideasTable.parentIdeaId, ideaId));

  const result = [];
  for (const branch of branches) {
    result.push(serializeIdea(branch));
    const subBranches = await getBranchesRecursive(branch.id);
    result.push(...subBranches);
  }
  return result;
}

// GET /api/profile/:username — public profiles only; no auth required, no sensitive fields
router.get("/:username", async (req: any, res): Promise<void> => {
  try {
    const { username } = req.params;

    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .limit(1);

    if (!users.length) {
      res.status(404).json({ error: "Profile not found" }); return;
    }

    const user = users[0];

    // Only expose profiles that the owner has set to public
    if (!user.isPublic) {
      res.status(404).json({ error: "Profile not found" }); return;
    }

    // Return only root ideas (no branches at the list level)
    const rootIdeas = await db
      .select()
      .from(ideasTable)
      .where(and(eq(ideasTable.userId, user.id), isNull(ideasTable.parentIdeaId)));

    const ideasWithBranches = await Promise.all(
      rootIdeas.map(async (idea) => {
        const branches = await getBranchesRecursive(idea.id);
        return { ...serializeIdea(idea), branches };
      }),
    );

    // Only return public-safe fields — no email, clerkUserId, themePreference
    res.json({
      user: serializePublicUser(user),
      ideas: ideasWithBranches,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get public profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
