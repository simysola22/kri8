import type { Request, Response, NextFunction } from "express";

export const DEV_CLERK_USER_ID = "dev-user";

/**
 * Dev mode is ONLY active when both conditions hold:
 *  1. NODE_ENV is explicitly "development"
 *  2. Clerk keys are absent (i.e. a local dev environment before Clerk is wired)
 *
 * In production (NODE_ENV !== "development"), missing Clerk keys cause the server
 * to refuse startup (see app.ts guard), so this flag will never be true there.
 */
export const isDevMode =
  process.env.NODE_ENV === "development" &&
  (!process.env.CLERK_SECRET_KEY || !process.env.CLERK_PUBLISHABLE_KEY);

export function devAuthMiddleware(
  req: Request & { __devUserId?: string },
  _res: Response,
  next: NextFunction,
) {
  if (isDevMode) {
    (req as any).__devUserId = DEV_CLERK_USER_ID;
  }
  next();
}
