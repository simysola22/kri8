import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';
import { shadcn } from '@clerk/themes';
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { useEffect, useRef } from "react";
import { applyTheme } from './lib/themes';
import { useGetMe } from '@workspace/api-client-react';

import Dashboard from './pages/dashboard';
import IdeaDetail from './pages/idea-detail';
import Settings from './pages/settings';
import PublicProfile from './pages/public-profile';
import CalendarPage from './pages/calendar';
import SocialPage from './pages/social';
import MessagesPage from './pages/messages';
import TrendsPage from './pages/trends';
import { ErrorBoundary } from './components/ErrorBoundary';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');
}

const resolvedClerkPubKey: string = clerkPubKey;

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(43 74% 49%)",
    colorForeground: "hsl(0 0% 98%)",
    colorMutedForeground: "hsl(0 0% 63.9%)",
    colorDanger: "hsl(0 62.8% 50.6%)",
    colorBackground: "hsl(228 34% 15%)",
    colorInput: "hsl(228 34% 12%)",
    colorInputForeground: "hsl(0 0% 98%)",
    colorNeutral: "hsl(228 34% 25%)",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#1a1f35] rounded-2xl w-[440px] max-w-full overflow-hidden shadow-2xl border border-white/10",
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

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#0d1117] px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#0d1117]/80 to-[#0d1117] pointer-events-none"></div>
      <div className="z-10 w-full max-w-[440px]">
        <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
      </div>
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#0d1117] px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#0d1117]/80 to-[#0d1117] pointer-events-none"></div>
      <div className="z-10 w-full max-w-[440px]">
        <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#0d1117]">
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-white animate-ping opacity-20"></div>
        <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.3)] z-10">
          <span className="text-4xl font-black text-[#1a1f35] tracking-tighter">kri8</span>
        </div>
      </div>
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <div className="flex min-h-[100dvh] items-center justify-center bg-[#0d1117] text-white">
           <div className="text-center space-y-8 max-w-2xl px-6">
             <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(212,175,55,0.4)]">
               <span className="text-3xl font-black text-[#1a1f35] tracking-tighter">kri8</span>
             </div>
             <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
               Where raw ideas<br/>become reality.
             </h1>
             <p className="text-xl text-slate-400">
               A creative thinker's private workspace. Organize, branch, and evolve your concepts into structured videos.
             </p>
             <div className="flex items-center justify-center gap-4 pt-8">
               <a href={`${basePath}/sign-in`} className="px-8 py-4 bg-white text-[#1a1f35] rounded-full font-bold text-lg hover:bg-slate-200 transition-colors shadow-lg">
                 Sign In
               </a>
               <a href={`${basePath}/sign-up`} className="px-8 py-4 bg-white/10 text-white rounded-full font-bold text-lg hover:bg-white/20 border border-white/20 transition-colors">
                 Create Account
               </a>
             </div>
           </div>
        </div>
      </Show>
    </>
  );
}

function DashboardProtect({ children }: { children: React.ReactNode }) {
  const { data: userProfile, isLoading } = useGetMe({ query: { enabled: true, retry: false, queryKey: [] } });

  useEffect(() => {
    if (userProfile?.themePreference) {
      applyTheme(userProfile.themePreference);
    }
  }, [userProfile?.themePreference]);

  if (isLoading) return <LoadingScreen />;

  return (
    <>
      <Show when="signed-in">
        {children}
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      
      {/* Protected Routes */}
      <Route path="/dashboard">
        <DashboardProtect>
          <ErrorBoundary><Dashboard /></ErrorBoundary>
        </DashboardProtect>
      </Route>
      <Route path="/ideas/:id">
        <DashboardProtect>
          <ErrorBoundary><IdeaDetail /></ErrorBoundary>
        </DashboardProtect>
      </Route>
      <Route path="/settings">
        <DashboardProtect>
          <ErrorBoundary><Settings /></ErrorBoundary>
        </DashboardProtect>
      </Route>
      <Route path="/calendar">
        <DashboardProtect>
          <ErrorBoundary><CalendarPage /></ErrorBoundary>
        </DashboardProtect>
      </Route>
      <Route path="/social">
        <DashboardProtect>
          <ErrorBoundary><SocialPage /></ErrorBoundary>
        </DashboardProtect>
      </Route>
      <Route path="/messages">
        <DashboardProtect>
          <ErrorBoundary><MessagesPage /></ErrorBoundary>
        </DashboardProtect>
      </Route>
      <Route path="/trends">
        <DashboardProtect>
          <ErrorBoundary><TrendsPage /></ErrorBoundary>
        </DashboardProtect>
      </Route>

      {/* Public Routes */}
      <Route path="/profile/:username">
        <ErrorBoundary><PublicProfile /></ErrorBoundary>
      </Route>
      
      <Route>
        <div className="flex min-h-screen items-center justify-center bg-[#0d1117] text-white">404 - Not Found</div>
      </Route>
    </Switch>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={resolvedClerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <AppRoutes />
        <Toaster />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
