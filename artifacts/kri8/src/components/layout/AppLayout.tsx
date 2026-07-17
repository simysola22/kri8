import { ReactNode } from "react";
import { Header } from "./Header";

// Animated nature background — only visible with theme-nature class on :root
function NatureBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-0 theme-nature-show">
      {/* Ambient gradient orbs */}
      <div
        className="absolute top-[-10%] left-[-5%] w-[50vw] h-[50vw] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(142 65% 30% / 0.18) 0%, transparent 70%)",
          animation: "nature-float 12s ease-in-out infinite",
        }}
      />
      <div
        className="absolute bottom-[-15%] right-[-10%] w-[45vw] h-[45vw] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(142 65% 25% / 0.14) 0%, transparent 70%)",
          animation: "nature-float 16s ease-in-out infinite reverse",
        }}
      />
      {/* Soft petal / flower hint */}
      <div
        className="absolute top-[15%] right-[10%] w-32 h-32 opacity-10"
        style={{
          background: "radial-gradient(circle, hsl(142 65% 52%) 0%, transparent 65%)",
          animation: "nature-sway 8s ease-in-out infinite",
          borderRadius: "60% 40% 70% 30%",
        }}
      />
    </div>
  );
}

// Animated sky background — only visible with theme-sky class on :root
function SkyBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-0 theme-sky-show">
      {/* Sky gradient base */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, hsl(213 70% 10%) 0%, hsl(213 70% 8%) 100%)",
        }}
      />
      {/* Slow-drifting cloud shapes */}
      <div
        className="absolute top-[8%] left-[-20%] w-[70%] h-16 rounded-full opacity-[0.07]"
        style={{
          background: "hsl(199 89% 80%)",
          filter: "blur(32px)",
          animation: "sky-drift 40s ease-in-out infinite alternate",
        }}
      />
      <div
        className="absolute top-[22%] right-[-15%] w-[60%] h-12 rounded-full opacity-[0.05]"
        style={{
          background: "hsl(199 89% 80%)",
          filter: "blur(24px)",
          animation: "sky-drift 55s ease-in-out infinite alternate-reverse",
        }}
      />
    </div>
  );
}

// Aurora ambient glow
function AuroraBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-0 theme-aurora-show">
      <div
        className="absolute top-0 left-0 right-0 h-[60vh]"
        style={{
          background: "linear-gradient(180deg, hsl(262 80% 25% / 0.3) 0%, transparent 100%)",
          animation: "aurora-wave 10s ease-in-out infinite",
        }}
      />
      <div
        className="absolute top-[-5%] left-[20%] w-[60%] h-[40%] rounded-full blur-3xl opacity-20"
        style={{
          background: "linear-gradient(90deg, hsl(262 80% 50%), hsl(199 89% 55%), hsl(142 65% 52%))",
          animation: "aurora-wave 14s ease-in-out infinite reverse",
        }}
      />
    </div>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full flex flex-col bg-background text-foreground relative">
      {/* Ambient background for themed pages */}
      <NatureBackground />
      <SkyBackground />
      <AuroraBackground />

      {/* Subtle global top glow */}
      <div className="fixed top-0 left-0 right-0 h-[50vh] pointer-events-none z-0"
        style={{
          background: "radial-gradient(ellipse 60% 30% at 50% 0%, hsl(var(--primary) / 0.06) 0%, transparent 100%)",
        }}
      />

      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 z-10 relative">
        {children}
      </main>
    </div>
  );
}
