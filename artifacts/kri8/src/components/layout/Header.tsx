import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAppUser } from "@/lib/AppUserContext";
import {
  Search, Bell, LayoutDashboard, Lightbulb, Calendar, Users,
  MessageSquare, TrendingUp, Download, Settings, LogOut, User,
  Palette, X, Menu, ChevronDown
} from "lucide-react";
import { THEMES, applyTheme } from "@/lib/themes";
import { useUpdateMe } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, match: ["/dashboard"] },
  { href: "/dashboard", label: "Ideas",     icon: Lightbulb,       match: [] as string[] },
  { href: "/calendar",  label: "Calendar",  icon: Calendar,        match: ["/calendar"] },
  { href: "/social",    label: "Community", icon: Users,           match: ["/social"] },
  { href: "/messages",  label: "Messages",  icon: MessageSquare,   match: ["/messages"] },
  { href: "/trends",    label: "Trends",    icon: TrendingUp,      match: ["/trends"] },
  { href: "/exports",   label: "Exports",   icon: Download,        match: ["/exports"] },
  { href: "/settings",  label: "Settings",  icon: Settings,        match: ["/settings"] },
];

function NavTab({ item, active }: { item: typeof NAV_ITEMS[0]; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link href={item.href}>
      <button
        className={cn(
          "relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap",
          "hover:text-foreground",
          active
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
        style={active ? {
          background: "var(--glass-active)",
          border: "1px solid var(--glass-border)",
          boxShadow: "0 0 12px var(--glass-active)",
        } : {
          border: "1px solid transparent",
        }}
      >
        <Icon className={cn("h-3.5 w-3.5 shrink-0", active && "text-primary")} />
        <span className="hidden sm:inline">{item.label}</span>
      </button>
    </Link>
  );
}

export function Header() {
  const [location, setLocation] = useLocation();
  const { user, signOut } = useAppUser();
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const updateMe = useUpdateMe();

  const handleThemeChange = (themeId: string) => {
    applyTheme(themeId);
    updateMe.mutate({ data: { themePreference: themeId } });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchOpen(false);
    setLocation(search.trim() ? `/dashboard?q=${encodeURIComponent(search.trim())}` : "/dashboard");
  };

  const handleSignOut = () => {
    signOut({ redirectUrl: import.meta.env.BASE_URL.replace(/\/$/, "") || "/" });
  };

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const isActive = (item: typeof NAV_ITEMS[0]) =>
    item.match.includes(location) ||
    (item.match.length === 0 && false); // "Ideas" never active independently

  return (
    <header
      className="sticky top-0 z-50 flex flex-col w-full"
      style={{
        background: "var(--glass-bg)",
        borderBottom: "1px solid var(--glass-border)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 px-4 h-14">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0 group">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
            style={{ background: "hsl(var(--primary))", boxShadow: "0 0 16px hsl(var(--primary) / 0.35)" }}
          >
            <span className="text-[10px] font-black tracking-tighter" style={{ color: "hsl(var(--primary-foreground))" }}>
              kri8
            </span>
          </div>
          <span className="font-bold text-lg tracking-tight hidden md:inline">kri8</span>
        </Link>

        {/* Search — desktop inline, mobile overlay */}
        <div className="flex-1 max-w-sm hidden md:block">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search ideas…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={cn(
                "w-full h-8 pl-9 pr-4 rounded-full text-sm transition-all duration-200 outline-none",
                "bg-[var(--glass-bg)] border border-[var(--glass-border)]",
                "text-foreground placeholder:text-muted-foreground",
                "focus:border-[hsl(var(--primary)/0.4)] focus:bg-[var(--glass-hover)]",
              )}
            />
          </form>
        </div>

        {/* Right: search icon (mobile) + bell + avatar */}
        <div className="flex items-center gap-1.5">
          {/* Mobile search button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="md:hidden h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Notification bell */}
          <button
            className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors relative"
            style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
          </button>

          {/* Avatar + profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 h-8 rounded-full pl-0.5 pr-2 transition-colors"
                style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}>
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user?.imageUrl ?? undefined} alt={user?.fullName || ""} />
                  <AvatarFallback className="text-xs font-bold">
                    {user?.firstName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-52 mt-1"
              style={{
                background: "hsl(var(--popover))",
                border: "1px solid var(--glass-border)",
                backdropFilter: "blur(20px)",
              }}
            >
              <DropdownMenuLabel className="font-normal py-2">
                <p className="text-sm font-semibold truncate">{user?.fullName || "Creator"}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator style={{ background: "var(--glass-border)" }} />
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                  <User className="h-4 w-4" />
                  My Profile
                </Link>
              </DropdownMenuItem>
              {/* Themes submenu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <DropdownMenuItem
                    onSelect={e => e.preventDefault()}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Palette className="h-4 w-4" />
                    Themes
                    <ChevronDown className="h-3 w-3 ml-auto -rotate-90" />
                  </DropdownMenuItem>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="left"
                  align="start"
                  className="w-52"
                  style={{
                    background: "hsl(var(--popover))",
                    border: "1px solid var(--glass-border)",
                    backdropFilter: "blur(20px)",
                  }}
                >
                  {THEMES.map(theme => (
                    <DropdownMenuItem
                      key={theme.id}
                      onClick={() => handleThemeChange(theme.id)}
                      className="cursor-pointer gap-2"
                    >
                      <span className="font-medium text-sm">{theme.name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenuSeparator style={{ background: "var(--glass-border)" }} />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive focus:bg-destructive/10 gap-2 cursor-pointer"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="sm:hidden h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* ── Primary nav tabs ──────────────────────────────────────────────── */}
      <nav
        className={cn(
          "flex items-center gap-1 px-3 py-1.5 overflow-x-auto",
          "scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
          "border-t border-[var(--glass-border)]",
          // Mobile: hide unless menu is open
          "hidden sm:flex",
        )}
      >
        {NAV_ITEMS.map(item => (
          <NavTab key={item.label} item={item} active={isActive(item)} />
        ))}
      </nav>

      {/* ── Mobile nav (hamburger expanded) ──────────────────────────────── */}
      {mobileOpen && (
        <nav
          className="sm:hidden flex flex-col gap-0.5 p-2 border-t border-[var(--glass-border)]"
          style={{ background: "hsl(var(--popover) / 0.95)", backdropFilter: "blur(20px)" }}
        >
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link key={item.label} href={item.href}>
                <button
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-[var(--glass-hover)]",
                  )}
                  style={active ? {
                    background: "var(--glass-active)",
                    border: "1px solid var(--glass-border)",
                  } : {}}
                >
                  <Icon className={cn("h-4 w-4", active && "text-primary")} />
                  {item.label}
                </button>
              </Link>
            );
          })}
        </nav>
      )}

      {/* ── Mobile search overlay ─────────────────────────────────────────── */}
      {searchOpen && (
        <div
          className="md:hidden fixed inset-0 z-[60] flex flex-col"
          style={{ background: "hsl(var(--background) / 0.96)", backdropFilter: "blur(20px)" }}
        >
          <div className="flex items-center gap-3 p-4 border-b border-[var(--glass-border)]">
            <form onSubmit={handleSearch} className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                ref={searchRef}
                type="search"
                placeholder="Search ideas, insights, notes…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-full text-sm outline-none bg-[var(--glass-bg)] border border-[var(--glass-border)] text-foreground placeholder:text-muted-foreground"
              />
            </form>
            <button
              onClick={() => setSearchOpen(false)}
              className="h-10 w-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
