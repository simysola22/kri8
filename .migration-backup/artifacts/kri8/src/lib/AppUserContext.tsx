import { createContext, useContext, type ReactNode } from "react";

export type AppUser = {
  fullName?: string | null;
  firstName?: string | null;
  imageUrl?: string | null;
  primaryEmailAddress?: { emailAddress: string } | null;
};

export type AppUserCtx = {
  user: AppUser | null;
  isLoaded: boolean;
  signOut: (opts?: { redirectUrl?: string }) => void | Promise<void>;
};

export const AppUserContext = createContext<AppUserCtx>({
  user: null,
  isLoaded: false,
  signOut: () => {},
});

export function useAppUser(): AppUserCtx {
  return useContext(AppUserContext);
}

export function AppUserProvider({
  value,
  children,
}: {
  value: AppUserCtx;
  children: ReactNode;
}) {
  return (
    <AppUserContext.Provider value={value}>{children}</AppUserContext.Provider>
  );
}
