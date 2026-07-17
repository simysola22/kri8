import path from "path";
import express, { type Express } from "express";
import cors, { type CorsOptions } from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
} from "./middlewares/clerkProxyMiddleware";
import { globalLimiter, writeLimiter } from "./middlewares/rateLimit";
import { isDevMode, devAuthMiddleware } from "./middlewares/devAuthMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";

// Fail closed: in any non-development environment, Clerk keys are mandatory.
// Missing keys in production would enable the dev-auth bypass for all users.
if (process.env.NODE_ENV !== "development") {
  if (!process.env.CLERK_SECRET_KEY || !process.env.CLERK_PUBLISHABLE_KEY) {
    logger.error(
      "CLERK_SECRET_KEY and CLERK_PUBLISHABLE_KEY must be set in non-development environments. Refusing to start.",
    );
    process.exit(1);
  }
}

/**
 * Build a CORS origin matcher that allows:
 *  - localhost on any port (local dev)
 *  - *.replit.app / *.replit.dev  (Replit preview & deployments)
 *  - *.vercel.app                  (Vercel preview deployments)
 *  - Any explicit origins in ALLOWED_ORIGIN env var (comma-separated;
 *    use this for production custom domains, e.g. https://kri8.com)
 */
function buildCorsOrigin(): CorsOptions["origin"] {
  const defaultPatterns: RegExp[] = [
    /^https?:\/\/localhost(:\d+)?$/,
    /^https:\/\/.+\.replit\.app$/,
    /^https:\/\/.+\.replit\.dev$/,
    /^https:\/\/[^.]+\.vercel\.app$/,
  ];

  const explicit: string[] = process.env.ALLOWED_ORIGIN
    ? process.env.ALLOWED_ORIGIN.split(",")
        .map((o) => o.trim())
        .filter(Boolean)
    : [];

  return (origin, callback) => {
    // No Origin header = server-to-server, curl, same-origin — always allow
    if (!origin) return callback(null, true);
    if (explicit.includes(origin)) return callback(null, true);
    if (defaultPatterns.some((re) => re.test(origin))) return callback(null, true);
    logger.warn({ origin }, "CORS: rejected origin");
    callback(new Error(`CORS: origin "${origin}" is not allowed`));
  };
}

const app: Express = express();

// Trust the reverse proxy (Replit / Railway / any load balancer) so
// rate-limiting and IP detection work correctly behind X-Forwarded-For headers.
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// Clerk proxy must be mounted before express.json()
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

app.use(cors({ credentials: true, origin: buildCorsOrigin() }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (!isDevMode) {
  app.use(
    clerkMiddleware({
      publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
      secretKey: process.env.CLERK_SECRET_KEY,
    }),
  );
} else {
  logger.warn(
    "⚠️  Dev mode: Clerk keys missing — authentication is disabled",
  );
}

app.use(devAuthMiddleware);

app.use("/api", globalLimiter);
app.use("/api", writeLimiter);
app.use("/api", router);

const clientDist = path.resolve(__dirname, "../../kri8/dist/public");
app.use(express.static(clientDist));
app.use((_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

export default app;
