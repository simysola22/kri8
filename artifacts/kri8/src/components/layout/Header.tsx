import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAppUser } from "@/lib/AppUserContext";
import { Search, Moon, Settings, LogOut, FileText, UserCircle, Calendar, Users, MessageSquare, TrendingUp } from "lucide-react";
import { THEMES, applyTheme } from "@/lib/themes";
import { useUpdateMe } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Header() {
  const { user, signOut } = useAppUser();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const updateMe = useUpdateMe();

  const handleThemeChange = (themeId: string) => {
    applyTheme(themeId);
    updateMe.mutate({ data: { themePreference: themeId } });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      setLocation(`/dashboard?q=${encodeURIComponent(search.trim())}`);
    } else {
      setLocation("/dashboard");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/dashboard" className="flex items-center gap-2 transition-transform hover:scale-105">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.4)]">
            <span className="text-primary-foreground font-black tracking-tighter text-xs">kri8</span>
          </div>
          <span className="font-bold text-xl hidden sm:inline-block">kri8</span>
        </Link>

        <form onSubmit={handleSearch} className="flex-1 max-w-md hidden md:flex relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search ideas, insights, notes..."
            className="w-full pl-9 bg-card border-white/10 focus-visible:ring-primary rounded-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div className="flex items-center gap-2 sm:gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Moon className="h-5 w-5" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card border-white/10">
              <DropdownMenuLabel>Themes</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              {THEMES.map((theme) => (
                <DropdownMenuItem
                  key={theme.id}
                  onClick={() => handleThemeChange(theme.id)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: 'var(--background)' }} />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{theme.name}</span>
                      <span className="text-xs text-muted-foreground">{theme.description}</span>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9 border border-white/10">
                  <AvatarImage src={user?.imageUrl ?? undefined} alt={user?.fullName || ""} />
                  <AvatarFallback>{user?.firstName?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-card border-white/10" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.primaryEmailAddress?.emailAddress}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem asChild>
                <Link href="/dashboard" className="cursor-pointer flex w-full items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  <span>My Ideas</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/calendar" className="cursor-pointer flex w-full items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>Calendar</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/trends" className="cursor-pointer flex w-full items-center">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  <span>Trends</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/social" className="cursor-pointer flex w-full items-center">
                  <Users className="mr-2 h-4 w-4" />
                  <span>Community</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/messages" className="cursor-pointer flex w-full items-center">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span>Messages</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer flex w-full items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                onClick={() => signOut({ redirectUrl: import.meta.env.BASE_URL.replace(/\/$/, "") || "/" })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
