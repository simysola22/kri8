import path from "path";
import express, { type Express } from "express";
import cors from "cors";
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

app.use(cors({ credentials: true, origin: true }));
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
