import { useState } from "react";
import { Link, useSearch } from "wouter";
import {
  useListIdeas,
  useGetIdeaStats,
  useCreateIdea,
  getListIdeasQueryKey,
  getGetIdeaStatsQueryKey
} from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { exportIdeasToPptx } from "@/lib/exportPptx";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Download, GitBranch, Calendar, LayoutGrid,
  CheckCircle2, Circle, Lightbulb, Flame, Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const q = searchParams.get("q") || "";

  const [filter, setFilter] = useState<"all" | "used" | "unused">("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { toast } = useToast();

  const { data: stats } = useGetIdeaStats({ query: { queryKey: getGetIdeaStatsQueryKey() } });

  const listParams = {
    search: q || undefined,
    parent_id: null,
    is_used: filter === "all" ? undefined : filter === "used" ? true : false,
  };

  const { data: ideas, isLoading } = useListIdeas(listParams, {
    query: { queryKey: getListIdeasQueryKey(listParams) },
  });

  const createIdea = useCreateIdea();

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createIdea.mutate({
      data: {
        title: formData.get("title") as string,
        insight: formData.get("insight") as string || undefined,
        origin: formData.get("origin") as string || undefined,
      }
    }, {
      onSuccess: () => {
        setIsCreateOpen(false);
        queryClient.invalidateQueries({ queryKey: getListIdeasQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetIdeaStatsQueryKey() });
        toast({ title: "Idea captured" });
      },
      onError: () => toast({ title: "Failed to capture idea", variant: "destructive" }),
    });
  };

  const handleExport = async () => {
    if (!ideas?.length) {
      toast({ title: "No ideas to export", variant: "destructive" });
      return;
    }
    try {
      await exportIdeasToPptx(ideas as any, "midnight-minimalist");
      toast({ title: "Export complete", description: "Your presentation has been downloaded." });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  const statCards = [
    { label: "Total Ideas", value: stats?.total ?? 0, icon: Lightbulb, color: "text-primary" },
    { label: "Unused", value: stats?.unused ?? 0, icon: Flame, color: "text-primary" },
    { label: "Branched", value: stats?.withBranches ?? 0, icon: GitBranch, color: "text-foreground" },
    { label: "This Week", value: stats?.createdThisWeek ?? 0, icon: Clock, color: "text-foreground" },
  ];

  return (
    <AppLayout>
      <div className="flex flex-col gap-7">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Ideas</h1>
            {q && (
              <p className="text-sm text-muted-foreground mt-0.5">
                Results for <span className="text-foreground font-medium">"{q}"</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="border-[var(--glass-border)] bg-[var(--glass-bg)] hover:bg-[var(--glass-hover)]"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" style={{ boxShadow: "0 0 16px hsl(var(--primary) / 0.25)" }}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  New Idea
                </Button>
              </DialogTrigger>
              <DialogContent
                className="sm:max-w-[480px]"
                style={{
                  background: "hsl(var(--card))",
                  border: "1px solid var(--glass-border)",
                  backdropFilter: "blur(20px)",
                }}
              >
                <DialogHeader>
                  <DialogTitle>Capture a New Idea</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="title">
                      Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="title" name="title" required autoFocus
                      placeholder="What's the idea?"
                      className="bg-background border-[var(--glass-border)]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="insight">Insight</Label>
                    <Textarea
                      id="insight" name="insight"
                      placeholder="The core concept or insight…"
                      className="bg-background border-[var(--glass-border)] min-h-[90px] resize-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="origin">Origin</Label>
                    <Input
                      id="origin" name="origin"
                      placeholder="Where did this idea come from?"
                      className="bg-background border-[var(--glass-border)]"
                    />
                  </div>
                  <DialogFooter className="pt-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreateOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" disabled={createIdea.isPending}>
                      {createIdea.isPending ? "Capturing…" : "Capture Idea"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="rounded-xl p-4 glass-panel"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
                <Icon className={`h-3.5 w-3.5 ${color}`} />
              </div>
              <p className={`text-3xl font-bold tracking-tight ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Filter + controls */}
        <div className="flex items-center gap-3">
          <Tabs value={filter} onValueChange={v => setFilter(v as any)}>
            <TabsList
              className="h-8 p-0.5 gap-0.5"
              style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
            >
              {["all", "unused", "used"].map(v => (
                <TabsTrigger
                  key={v}
                  value={v}
                  className="h-7 px-3 text-xs rounded-full capitalize data-[state=active]:bg-[var(--glass-active)]"
                >
                  {v === "all" ? "All" : v === "unused" ? "Raw" : "Used"}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          {q && (
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="h-8 text-xs">
                Clear search
              </Button>
            </Link>
          )}
        </div>

        {/* Ideas grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 rounded-xl animate-pulse glass-panel" />
            ))}
          </div>
        ) : !ideas?.length ? (
          <div
            className="text-center py-20 rounded-2xl border border-dashed"
            style={{ borderColor: "var(--glass-border)", background: "var(--glass-bg)" }}
          >
            <LayoutGrid className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-40" />
            <h3 className="text-lg font-semibold mb-1">
              {q ? `No results for "${q}"` : "No ideas yet"}
            </h3>
            <p className="text-sm text-muted-foreground mb-5">
              {q ? "Try a different search term." : "Capture your first idea to get started."}
            </p>
            {!q && (
              <Button size="sm" onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Capture Idea
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ideas.map(idea => (
              <Link key={idea.id} href={`/ideas/${idea.id}`}>
                <Card
                  className="group cursor-pointer h-full flex flex-col transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: "var(--glass-bg)",
                    border: "1px solid var(--glass-border)",
                    backdropFilter: "blur(12px)",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--primary) / 0.4)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px hsl(var(--primary) / 0.08)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--glass-border)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <Badge
                        variant={idea.isUsed ? "secondary" : "default"}
                        className="h-5 text-[10px] font-medium px-1.5"
                      >
                        {idea.isUsed
                          ? <><CheckCircle2 className="h-2.5 w-2.5 mr-1" />Used</>
                          : <><Circle className="h-2.5 w-2.5 mr-1" />Raw</>}
                      </Badge>
                      {idea.branchCount > 0 && (
                        <Badge variant="outline" className="h-5 text-[10px] font-medium px-1.5 border-primary/30 text-primary bg-primary/5">
                          <GitBranch className="h-2.5 w-2.5 mr-1" />
                          {idea.branchCount}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {idea.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 pb-2">
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {idea.insight || "No insight documented yet."}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0 text-[10px] text-muted-foreground/50 flex items-center gap-1">
                    <Calendar className="h-2.5 w-2.5" />
                    {new Date(idea.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
