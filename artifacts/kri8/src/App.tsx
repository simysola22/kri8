import { useEffect, useRef, type ReactNode } from "react";
import {
  Switch,
  Route,
  useLocation,
  Router as WouterRouter,
  Redirect,
} from "wouter";
import {
  ClerkProvider,
  SignIn,
  SignUp,
  useClerk,
  useUser,
  useAuth,
  Show,
} from "@clerk/react";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { applyTheme } from "./lib/themes";
import { useGetMe } from "@workspace/api-client-react";
import { DevAuthProvider, DevSignInPage } from "./lib/devAuth";
import { AppUserProvider, type AppUserCtx } from "./lib/AppUserContext";

import Dashboard from "./pages/dashboard";
import IdeaDetail from "./pages/idea-detail";
import Settings from "./pages/settings";
import PublicProfile from "./pages/public-profile";
import CalendarPage from "./pages/calendar";
import SocialPage from "./pages/social";
import MessagesPage from "./pages/messages";
import TrendsPage from "./pages/trends";
import { ErrorBoundary } from "./components/ErrorBoundary";

// ─── Constants ────────────────────────────────────────────────────────────────

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as
  | string
  | undefined;
const IS_DEV_MODE = !clerkPubKey;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const landingUrl = basePath || "/";

// Clerk proxy URL — only used when explicitly configured via env var.
// Set VITE_CLERK_PROXY_URL=https://your-api.onrender.com/api/__clerk in Vercel
// when your Clerk instance requires proxying (Replit-managed Clerk, or custom
// domains without a CNAME). Leave unset to have Clerk call its FAPI directly.
const clerkProxyUrl =
  import.meta.env.PROD && import.meta.env.VITE_CLERK_PROXY_URL
    ? (import.meta.env.VITE_CLERK_PROXY_URL as string)
    : undefined;

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

function dismissSplash() {
  const splash = document.getElementById("kri8-splash");
  if (splash && !splash.classList.contains("fade-out")) {
    splash.classList.add("fade-out");
    setTimeout(() => splash.remove(), 500);
  }
}

// ─── Shared components ────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#0d1117]">
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-white animate-ping opacity-20 w-32 h-32"></div>
        <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.3)] z-10">
          <span className="text-4xl font-black text-[#1a1f35] tracking-tighter">
            kri8
          </span>
        </div>
      </div>
    </div>
  );
}

// Gate: fetches current user from DB, applies theme, then dismisses splash
function AppGate({ children }: { children: ReactNode }) {
  const { data: userProfile, isLoading } = useGetMe({
    query: { enabled: true, retry: false, queryKey: [] },
  });

  useEffect(() => {
    if (userProfile?.themePreference) applyTheme(userProfile.themePreference);
  }, [userProfile?.themePreference]);

  useEffect(() => {
    if (!isLoading) dismissSplash();
  }, [isLoading]);

  if (isLoading) return <LoadingScreen />;
  return <>{children}</>;
}

// ─── DEV MODE (local fallback — Clerk keys absent) ────────────────────────────

function DevKeysMissing() {
  useEffect(() => {
    dismissSplash();
  }, []);
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#0d1117] text-white">
      <div className="text-center space-y-4 p-8 rounded-2xl bg-white/5 border border-white/10 max-w-sm w-full">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto">
          <span className="text-xl font-black text-[#1a1f35]">kri8</span>
        </div>
        <h2 className="text-xl font-bold">Authentication Not Configured</h2>
        <p className="text-slate-400 text-sm">
          Set{" "}
          <code className="text-yellow-300">VITE_CLERK_PUBLISHABLE_KEY</code>{" "}
          and <code className="text-yellow-300">CLERK_SECRET_KEY</code> to
          enable authentication.
        </p>
      </div>
    </div>
  );
}

function DevRoutes() {
  return (
    <Switch>
      <Route path="/sign-in/*?">
        <DevSignInPage basePath={basePath} />
      </Route>
      <Route path="/sign-up/*?">
        <DevSignInPage basePath={basePath} />
      </Route>
      <Route path="/profile/:username">
        <ErrorBoundary>
          <PublicProfile />
        </ErrorBoundary>
      </Route>
      <Route>
        <DevKeysMissing />
      </Route>
    </Switch>
  );
}

function DevApp() {
  return (
    <WouterRouter base={basePath}>
      <DevAuthProvider>
        <QueryClientProvider client={queryClient}>
          <DevRoutes />
          <Toaster />
        </QueryClientProvider>
      </DevAuthProvider>
    </WouterRouter>
  );
}

// ─── CLERK MODE ───────────────────────────────────────────────────────────────

// Must be rendered INSIDE ClerkProvider — safely calls useUser + useClerk
function ClerkUserBridge({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  const value: AppUserCtx = {
    user: user
      ? {
          fullName: user.fullName,
          firstName: user.firstName,
          imageUrl: user.imageUrl,
          primaryEmailAddress: user.primaryEmailAddress
            ? { emailAddress: user.primaryEmailAddress.emailAddress }
            : null,
        }
      : null,
    isLoaded,
    signOut: (opts) =>
      signOut({ redirectUrl: opts?.redirectUrl ?? landingUrl }),
  };

  return <AppUserProvider value={value}>{children}</AppUserProvider>;
}

// Dismisses the splash once Clerk finishes initializing, regardless of auth state
function SplashDismisser() {
  const { isLoaded } = useUser();
  useEffect(() => {
    if (isLoaded) dismissSplash();
  }, [isLoaded]);
  return null;
}

// Wires Clerk's session JWT into the API client as a Bearer token.
// Required when the API lives on a different domain (Render) from the
// frontend (Vercel). No-ops in dev mode where the API is same-origin via proxy.
function ApiAuthBridge() {
  const { getToken } = useAuth();
  useEffect(() => {
    setAuthTokenGetter(() => getToken());
    return () => setAuthTokenGetter(null);
  }, [getToken]);
  return null;
}

function ClerkQueryCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    return addListener(({ user }: any) => {
      const uid = user?.id ?? null;
      if (prevIdRef.current !== undefined && prevIdRef.current !== uid)
        qc.clear();
      prevIdRef.current = uid;
    });
  }, [addListener, qc]);

  return null;
}

function ClerkProtect({ children }: { children: ReactNode }) {
  return (
    <>
      <Show when="signed-in">
        <AppGate>{children}</AppGate>
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function ClerkRoutes() {
  const HomeRedirect = () => (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <div className="flex min-h-[100dvh] items-center justify-center bg-[#0d1117] text-white">
          <div className="text-center space-y-8 max-w-2xl px-6">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(212,175,55,0.4)]">
              <span className="text-3xl font-black text-[#1a1f35] tracking-tighter">
                kri8
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
              Where raw ideas
              <br />
              become reality.
            </h1>
            <p className="text-xl text-slate-400">
              A creative thinker's private workspace. Organize, branch, and
              evolve your concepts into structured videos.
            </p>
            <div className="flex items-center justify-center gap-4 pt-8">
              <a
                href={`${basePath}/sign-in`}
                className="px-8 py-4 bg-white text-[#1a1f35] rounded-full font-bold text-lg hover:bg-slate-200 transition-colors shadow-lg"
              >
                Sign In
              </a>
              <a
                href={`${basePath}/sign-up`}
                className="px-8 py-4 bg-white/10 text-white rounded-full font-bold text-lg hover:bg-white/20 border border-white/20 transition-colors"
              >
                Create Account
              </a>
            </div>
          </div>
        </div>
      </Show>
    </>
  );

  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/sign-in/*?">
        <div className="flex min-h-[100dvh] items-center justify-center bg-[#0d1117] px-4">
          <div className="z-10 w-full max-w-[440px]">
            <SignIn
              routing="path"
              path={`${basePath}/sign-in`}
              signUpUrl={`${basePath}/sign-up`}
              fallbackRedirectUrl={`${basePath}/dashboard`}
            />
          </div>
        </div>
      </Route>
      <Route path="/sign-up/*?">
        <div className="flex min-h-[100dvh] items-center justify-center bg-[#0d1117] px-4">
          <div className="z-10 w-full max-w-[440px]">
            <SignUp
              routing="path"
              path={`${basePath}/sign-up`}
              signInUrl={`${basePath}/sign-in`}
              fallbackRedirectUrl={`${basePath}/dashboard`}
            />
          </div>
        </div>
      </Route>

      <Route path="/dashboard">
        <ClerkProtect>
          <ErrorBoundary>
            <Dashboard />
          </ErrorBoundary>
        </ClerkProtect>
      </Route>
      <Route path="/ideas/:id">
        <ClerkProtect>
          <ErrorBoundary>
            <IdeaDetail />
          </ErrorBoundary>
        </ClerkProtect>
      </Route>
      <Route path="/settings">
        <ClerkProtect>
          <ErrorBoundary>
            <Settings />
          </ErrorBoundary>
        </ClerkProtect>
      </Route>
      <Route path="/calendar">
        <ClerkProtect>
          <ErrorBoundary>
            <CalendarPage />
          </ErrorBoundary>
        </ClerkProtect>
      </Route>
      <Route path="/social">
        <ClerkProtect>
          <ErrorBoundary>
            <SocialPage />
          </ErrorBoundary>
        </ClerkProtect>
      </Route>
      <Route path="/messages">
        <ClerkProtect>
          <ErrorBoundary>
            <MessagesPage />
          </ErrorBoundary>
        </ClerkProtect>
      </Route>
      <Route path="/trends">
        <ClerkProtect>
          <ErrorBoundary>
            <TrendsPage />
          </ErrorBoundary>
        </ClerkProtect>
      </Route>
      <Route path="/profile/:username">
        <ErrorBoundary>
          <PublicProfile />
        </ErrorBoundary>
      </Route>
      <Route>
        <div className="flex min-h-screen items-center justify-center bg-[#0d1117] text-white">
          404 - Not Found
        </div>
      </Route>
    </Switch>
  );
}

function ClerkApp() {
  const [, setLocation] = useLocation();

  const appearance = {
    cssLayerName: "clerk",
    variables: {
      colorPrimary: "hsl(43 74% 49%)",
      colorForeground: "hsl(0 0% 98%)",
      colorMutedForeground: "hsl(0 0% 63.9%)",
      colorDanger: "hsl(0 62.8% 50.6%)",
      colorBackground: "hsl(228 34% 15%)",
      colorInput: "hsl(228 34% 12%)",
      colorInputForeground: "hsl(0 0% 98%)",
      colorNeutral: "hsl(228 34% 25%)",
      fontFamily: "system-ui, -apple-system, sans-serif",
      borderRadius: "0.5rem",
    },
    elements: {
      rootBox: "w-full flex justify-center",
      cardBox:
        "bg-[#1a1f35] rounded-2xl w-[440px] max-w-full overflow-hidden shadow-2xl border border-white/10",
      card: "!shadow-none !border-0 !bg-transparent !rounded-none",
      footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
      headerTitle: "text-white font-bold text-2xl",
      headerSubtitle: "text-slate-300",
      socialButtonsBlockButtonText: "text-white font-medium",
      formFieldLabel: "text-slate-200",
      footerActionLink: "text-[#d4af37] hover:text-[#f3cd57]",
      footerActionText: "text-slate-400",
      dividerText: "text-slate-400",
    },
  };

  return (
    <ClerkProvider
      publishableKey={clerkPubKey!}
      proxyUrl={clerkProxyUrl}
      appearance={appearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      afterSignOutUrl={landingUrl}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <ClerkUserBridge>
        <QueryClientProvider client={queryClient}>
          <SplashDismisser />
          <ApiAuthBridge />
          <ClerkQueryCacheInvalidator />
          <ClerkRoutes />
          <Toaster />
        </QueryClientProvider>
      </ClerkUserBridge>
    </ClerkProvider>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

function App() {
  if (IS_DEV_MODE) return <DevApp />;

  return (
    <WouterRouter base={basePath}>
      <ClerkApp />
    </WouterRouter>
  );
}

export default App;
