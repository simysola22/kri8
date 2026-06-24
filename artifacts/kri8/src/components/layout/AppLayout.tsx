import { ReactNode } from "react";
import { Header } from "./Header";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full flex flex-col bg-background text-foreground relative">
      <div className="fixed inset-0 pointer-events-none opacity-20 transition-opacity duration-1000 z-0">
        <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-primary/10 to-transparent" />
      </div>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 z-10 relative">
        {children}
      </main>
    </div>
  );
}
