import type { ReactNode } from "react";
import { AppUserProvider } from "./AppUserContext";
import type { AppUserCtx } from "./AppUserContext";

const NO_AUTH_USER_CTX: AppUserCtx = {
  user: null,
  isLoaded: true,
  signOut: async () => {},
};

export function DevAuthProvider({ children }: { children: ReactNode }) {
  return (
    <AppUserProvider value={NO_AUTH_USER_CTX}>{children}</AppUserProvider>
  );
}

export function DevSignInPage({ basePath: _basePath }: { basePath: string }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#0d1117] text-white">
      <div className="text-center space-y-4 p-8 rounded-2xl bg-white/5 border border-white/10 max-w-sm w-full">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto">
          <span className="text-xl font-black text-[#1a1f35]">kri8</span>
        </div>
        <h2 className="text-xl font-bold">Authentication Not Configured</h2>
        <p className="text-slate-400 text-sm">
          Set <code className="text-yellow-300">VITE_CLERK_PUBLISHABLE_KEY</code> and{" "}
          <code className="text-yellow-300">CLERK_SECRET_KEY</code> to enable sign-in.
        </p>
      </div>
    </div>
  );
}
