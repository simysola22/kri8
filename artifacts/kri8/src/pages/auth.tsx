import { SignIn, SignUp } from "@clerk/react";
import { motion } from "framer-motion";
import { Sparkles, Zap, CalendarDays, TrendingUp } from "lucide-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

// ─── Feature cards shown on the hero side ─────────────────────────────────────

const FEATURES = [
  {
    Icon: Sparkles,
    title: "Capture Ideas",
    desc: "Never lose a creative spark",
  },
  {
    Icon: Zap,
    title: "Branch & Evolve",
    desc: "Turn sparks into structured content",
  },
  {
    Icon: CalendarDays,
    title: "Schedule Smarter",
    desc: "Map ideas to your calendar",
  },
  {
    Icon: TrendingUp,
    title: "Ride Trends",
    desc: "Discover viral angles early",
  },
];

// ─── Clerk appearance — transparent card so our glass panel shows through ─────

const clerkAppearance = {
  cssLayerName: "clerk",
  variables: {
    colorPrimary: "hsl(43 74% 49%)",
    colorForeground: "hsl(0 0% 98%)",
    colorMutedForeground: "rgba(255,255,255,0.55)",
    colorDanger: "hsl(0 62.8% 50.6%)",
    colorBackground: "transparent",
    colorInput: "rgba(255,255,255,0.07)",
    colorInputForeground: "hsl(0 0% 98%)",
    colorNeutral: "rgba(255,255,255,0.25)",
    fontFamily: "system-ui, -apple-system, sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full !shadow-none !border-0",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "!text-white !font-bold !text-xl",
    headerSubtitle: "!text-white/55",
    socialButtonsBlockButton:
      "!border-white/15 !bg-white/6 hover:!bg-white/10 !transition-colors",
    socialButtonsBlockButtonText: "!text-white !font-medium",
    formFieldLabel: "!text-white/75 !text-sm !font-medium",
    formFieldInput:
      "!bg-white/8 !border-white/15 !text-white placeholder:!text-white/30 focus:!border-white/35",
    formButtonPrimary:
      "!bg-white !text-[#1a1f35] hover:!bg-white/90 !font-bold !shadow-lg !transition-all",
    footerActionLink: "!text-[#d4af37] hover:!text-[#f3cd57]",
    footerActionText: "!text-white/45",
    dividerText: "!text-white/35",
    dividerLine: "!bg-white/10",
    identityPreviewText: "!text-white/80",
    identityPreviewEditButton: "!text-[#d4af37]",
    otpCodeFieldInput: "!bg-white/8 !border-white/15 !text-white",
  },
};

// ─── Left hero panel (desktop only) ───────────────────────────────────────────

function HeroSide() {
  return (
    <div className="relative flex h-full flex-col justify-between p-12 overflow-hidden">
      {/* Ambient gradient orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-1/4 top-1/4 h-96 w-96 animate-pulse rounded-full blur-3xl opacity-25"
          style={{ background: "var(--glass-active)" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 h-64 w-64 animate-pulse rounded-full blur-3xl opacity-15"
          style={{ background: "var(--glass-border)", animationDelay: "1.2s" }}
        />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="relative z-10 flex items-center gap-3"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg">
          <span className="text-sm font-black tracking-tighter text-[#1a1f35]">
            kri8
          </span>
        </div>
      </motion.div>

      {/* Main copy + feature cards */}
      <div className="relative z-10 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.1 }}
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/35">
            The Creator Workspace
          </p>
          <h1 className="text-5xl font-bold leading-tight tracking-tight text-white">
            Where raw ideas
            <br />
            <span className="bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">
              become reality.
            </span>
          </h1>
          <p className="mt-4 max-w-sm text-base leading-relaxed text-white/50">
            Capture, branch, schedule, and discover trending angles for your
            content ideas — all in one workspace built for creators.
          </p>
        </motion.div>

        {/* Floating feature cards */}
        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map(({ Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.22 + i * 0.07 }}
              className="glass-panel glass-hover rounded-xl p-4 transition-colors duration-200"
            >
              <Icon className="mb-2 h-4 w-4 text-white/60" />
              <p className="text-sm font-semibold text-white">{title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-white/45">
                {desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom attribution */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.65 }}
        className="relative z-10 text-xs text-white/25"
      >
        Trusted by creators worldwide.
      </motion.p>
    </div>
  );
}

// ─── Shared auth layout ────────────────────────────────────────────────────────

function AuthLayout({
  mode,
  children,
}: {
  mode: "sign-in" | "sign-up";
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-[100dvh] overflow-hidden bg-[#0d1117]">
      {/* Full-page ambient blobs */}
      <div className="pointer-events-none fixed inset-0">
        <div
          className="absolute -left-32 -top-32 h-[600px] w-[600px] rounded-full blur-3xl opacity-20"
          style={{ background: "var(--glass-active)" }}
        />
        <div
          className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full blur-3xl opacity-15"
          style={{ background: "var(--glass-active)" }}
        />
      </div>

      {/* Left hero — desktop only */}
      <div
        className="relative hidden lg:block lg:w-1/2"
        style={{
          background: "var(--glass-bg)",
          borderRight: "1px solid var(--glass-border)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <HeroSide />
      </div>

      {/* Right auth panel */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center p-6 lg:p-12">
        {/* Mobile logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-8 flex items-center gap-2 lg:hidden"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white">
            <span className="text-xs font-black tracking-tighter text-[#1a1f35]">
              kri8
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.975, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="w-full max-w-[440px]"
        >
          {/* Heading above the Clerk card */}
          <div className="mb-5 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-white">
              {mode === "sign-in" ? "Welcome back" : "Start creating"}
            </h2>
            <p className="mt-1 text-sm text-white/45">
              {mode === "sign-in"
                ? "Sign in to your kri8 workspace"
                : "Create your free kri8 account today"}
            </p>
          </div>

          {/* Glass card wrapping Clerk component */}
          <div
            className="overflow-hidden rounded-2xl shadow-2xl"
            style={{
              background: "var(--glass-bg)",
              border: "1px solid var(--glass-border)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
          >
            <div className="p-3">{children}</div>
          </div>

          {/* Back to home link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-center"
          >
            <a
              href={basePath || "/"}
              className="text-xs text-white/30 transition-colors hover:text-white/60"
            >
              ← Back to home
            </a>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Exported page components ─────────────────────────────────────────────────

export function AuthSignInPage() {
  return (
    <AuthLayout mode="sign-in">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        fallbackRedirectUrl={`${basePath}/dashboard`}
        appearance={clerkAppearance}
      />
    </AuthLayout>
  );
}

export function AuthSignUpPage() {
  return (
    <AuthLayout mode="sign-up">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        fallbackRedirectUrl={`${basePath}/dashboard`}
        appearance={clerkAppearance}
      />
    </AuthLayout>
  );
}
