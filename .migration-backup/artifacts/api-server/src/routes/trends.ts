import { Router } from "express";
import { createTrendProvider, analyzeIdea, generateInspiration } from "@workspace/trend-engine";
import { requireAuth } from "./users";

const router = Router();

let dashboardCache: { data: unknown; expiresAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// GET /api/trends/dashboard
router.get("/dashboard", requireAuth, async (req: any, res): Promise<void> => {
  try {
    if (dashboardCache && dashboardCache.expiresAt > Date.now()) {
      res.json(dashboardCache.data);
      return;
    }

    const provider = createTrendProvider();
    const dashboard = await provider.getDashboard();
    dashboardCache = { data: dashboard, expiresAt: Date.now() + CACHE_TTL_MS };
    res.json(dashboard);
  } catch (err) {
    req.log.error({ err }, "Failed to get trend dashboard");
    res.status(500).json({ error: "Internal error" });
  }
});

// POST /api/trends/analyze
router.post("/analyze", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const { title, notes } = req.body as { title: string; notes?: string };
    if (!title?.trim()) { res.status(400).json({ error: "title is required" }); return; }

    const provider = createTrendProvider();
    const dashboard = await provider.getDashboard();
    const result = analyzeIdea(title, notes ?? "", dashboard);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to analyze idea");
    res.status(500).json({ error: "Internal error" });
  }
});

// POST /api/trends/inspire
router.post("/inspire", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const { title, notes } = req.body as { title: string; notes?: string };
    if (!title?.trim()) { res.status(400).json({ error: "title is required" }); return; }

    const provider = createTrendProvider();
    const keywordTrends = await provider.getKeywordTrends(
      title.toLowerCase().split(/\s+/).filter(w => w.length > 3).slice(0, 5)
    );
    const result = await generateInspiration(title, notes ?? "", keywordTrends);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to generate inspiration");
    res.status(500).json({ error: "Internal error" });
  }
});

export default router;
