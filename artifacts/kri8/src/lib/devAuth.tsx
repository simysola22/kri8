import { createContext, useContext, type ReactNode } from "react";
import { AppUserProvider, type AppUserCtx } from "./AppUserContext";

export const DEV_USER = {
  id: "dev-user",
  name: "Demo Creator",
  username: "demo_creator",
  primaryEmailAddress: { emailAddress: "demo@kri8.dev" },
};

const DEV_APP_USER: AppUserCtx = {
  user: {
    fullName: "Demo Creator",
    firstName: "Demo",
    imageUrl: null,
    primaryEmailAddress: { emailAddress: "demo@kri8.dev" },
  },
  isLoaded: true,
  signOut: async () => {
    window.location.href = "/";
  },
};

type DevAuthCtxType = { isSignedIn: boolean; user: typeof DEV_USER };
const DevAuthContext = createContext<DevAuthCtxType>({
  isSignedIn: true,
  user: DEV_USER,
});

export function DevAuthProvider({ children }: { children: ReactNode }) {
  return (
    <DevAuthContext.Provider value={{ isSignedIn: true, user: DEV_USER }}>
      <AppUserProvider value={DEV_APP_USER}>{children}</AppUserProvider>
    </DevAuthContext.Provider>
  );
}

export function useDevAuth() {
  return useContext(DevAuthContext);
}

export function DevSignInPage({ basePath }: { basePath: string }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#0d1117] text-white">
      <div className="text-center space-y-4 p-8 rounded-2xl bg-white/5 border border-white/10 max-w-sm w-full">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto">
          <span className="text-xl font-black text-[#1a1f35]">kri8</span>
        </div>
        <h2 className="text-xl font-bold">Dev Mode — Auto Sign-In</h2>
        <p className="text-slate-400 text-sm">
          Clerk keys are not configured. You are automatically signed in as{" "}
          <span className="text-white font-medium">Demo Creator</span>.
        </p>
        <a
          href={`${basePath}/dashboard`}
          className="block w-full py-3 bg-white text-[#1a1f35] rounded-full font-bold hover:bg-slate-200 transition-colors"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}
