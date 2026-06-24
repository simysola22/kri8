import { Router } from "express";
import { db, usersTable, ideasTable } from "@workspace/db";
import { eq, isNull } from "drizzle-orm";

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

// GET /api/profile/:username
router.get("/:username", async (req, res): Promise<void> => {
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

    const rootIdeas = await db
      .select()
      .from(ideasTable)
      .where(eq(ideasTable.userId, user.id));

    const ideasWithBranches = await Promise.all(
      rootIdeas.map(async (idea) => {
        const branches = await getBranchesRecursive(idea.id);
        return { ...serializeIdea(idea), branches };
      }),
    );

    res.json({
      user: {
        id: user.id,
        clerkUserId: user.clerkUserId,
        email: user.email,
        name: user.name,
        username: user.username,
        themePreference: user.themePreference,
        createdAt: user.createdAt.toISOString(),
      },
      ideas: ideasWithBranches,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
