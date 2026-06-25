import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";

const router: IRouter = Router();

router.get("/healthz", async (_req, res): Promise<void> => {
  const start = Date.now();
  try {
    await pool.query("SELECT 1");
    const dbMs = Date.now() - start;

    const poolStats = {
      total: pool.totalCount,
      idle: pool.idleCount,
      waiting: pool.waitingCount,
    };

    res.json({
      status: "ok",
      uptime: Math.floor(process.uptime()),
      dbLatencyMs: dbMs,
      pool: poolStats,
      memory: {
        heapUsedMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rssMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
    });
  } catch (err) {
    res.status(503).json({ status: "error", error: "DB unreachable", dbLatencyMs: Date.now() - start });
  }
});

export default router;
