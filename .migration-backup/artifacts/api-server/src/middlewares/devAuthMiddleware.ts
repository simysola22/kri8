import type { Request, Response, NextFunction } from "express";

export const DEV_CLERK_USER_ID = "dev-user";

export const isDevMode =
  !process.env.CLERK_SECRET_KEY || !process.env.CLERK_PUBLISHABLE_KEY;

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
