import { useState, useEffect } from "react";
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
import { Plus, Download, GitBranch, Calendar, LayoutGrid, CheckCircle2, Circle } from "lucide-react";
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
    parent_id: null, // only fetch root ideas on dashboard
    is_used: filter === "all" ? undefined : filter === "used" ? true : false
  };
  
  const { data: ideas, isLoading } = useListIdeas(listParams, {
    query: { queryKey: getListIdeasQueryKey(listParams) }
  });

  // ── TEMPORARY DEBUG INSTRUMENTATION ─────────────────────────────────────────
  useEffect(() => {
    console.group('[kri8-debug] useListIdeas data changed');
    console.log('typeof ideas         :', typeof ideas);
    console.log('Array.isArray(ideas) :', Array.isArray(ideas));
    console.log('raw value            :', ideas);
    if (ideas && typeof ideas === 'object' && !Array.isArray(ideas)) {
      console.log('keys (object)        :', Object.keys(ideas as any));
    }
    if (typeof ideas === 'string') {
      console.log('string preview       :', (ideas as string).slice(0, 300));
    }
    console.groupEnd();
  }, [ideas]);

  useEffect(() => {
    fetch('/api/ideas', { credentials: 'include' })
      .then(async (res) => {
        const contentType = res.headers.get('content-type');
        const raw = await res.text();
        let parsed: unknown;
        try { parsed = JSON.parse(raw); } catch { parsed = raw; }
        console.group('[kri8-debug] Direct GET /api/ideas (raw fetch)');
        console.log('status       :', res.status, res.statusText);
        console.log('content-type :', contentType);
        console.log('Array.isArray:', Array.isArray(parsed));
        console.log('typeof body  :', typeof parsed);
        console.log('body preview :', raw.slice(0, 500));
        console.log('parsed value :', parsed);
        console.groupEnd();
      })
      .catch((err) => console.error('[kri8-debug] Direct fetch error:', err));
  }, []);
  // ── END DEBUG ────────────────────────────────────────────────────────────────

  const createIdea = useCreateIdea();

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createIdea.mutate({
      data: {
        title: formData.get("title") as string,
        insight: formData.get("insight") as string,
        origin: formData.get("origin") as string,
      }
    }, {
      onSuccess: () => {
        setIsCreateOpen(false);
        queryClient.invalidateQueries({ queryKey: getListIdeasQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetIdeaStatsQueryKey() });
        toast({ title: "Idea created successfully" });
      }
    });
  };

  const handleExport = async () => {
    if (!ideas?.length) return;
    try {
      await exportIdeasToPptx(ideas as any, "midnight-minimalist"); // would get from theme
      toast({ title: "Export complete", description: "Your presentation has been downloaded." });
    } catch (e) {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card/50 border-white/5 backdrop-blur">
            <CardHeader className="pb-2">
              <CardDescription>Total Ideas</CardDescription>
              <CardTitle className="text-4xl">{stats?.total || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-card/50 border-white/5 backdrop-blur">
            <CardHeader className="pb-2">
              <CardDescription>Unused</CardDescription>
              <CardTitle className="text-4xl text-primary">{stats?.unused || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-card/50 border-white/5 backdrop-blur">
            <CardHeader className="pb-2">
              <CardDescription>With Branches</CardDescription>
              <CardTitle className="text-4xl">{stats?.withBranches || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-card/50 border-white/5 backdrop-blur">
            <CardHeader className="pb-2">
              <CardDescription>Created this Week</CardDescription>
              <CardTitle className="text-4xl">{stats?.createdThisWeek || 0}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full md:w-auto">
              <TabsList className="bg-card border border-white/10">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unused">Raw</TabsTrigger>
                <TabsTrigger value="used">Used</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button variant="outline" onClick={handleExport} className="w-full md:w-auto border-white/10 bg-card">
              <Download className="h-4 w-4 mr-2" />
              Export PPTX
            </Button>
            
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="w-full md:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  New Idea
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] bg-card border-white/10">
                <DialogHeader>
                  <DialogTitle>Capture a New Idea</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
                    <Input id="title" name="title" required className="bg-background border-white/10" autoFocus />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="insight">Insight (The core concept)</Label>
                    <Textarea id="insight" name="insight" className="bg-background border-white/10 min-h-[100px]" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="origin">Origin (Where did this come from?)</Label>
                    <Input id="origin" name="origin" className="bg-background border-white/10" />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={createIdea.isPending}>
                      {createIdea.isPending ? "Capturing..." : "Capture Idea"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Ideas Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <Card key={i} className="h-48 animate-pulse bg-card/40 border-white/5" />
            ))}
          </div>
        ) : !ideas?.length ? (
          <div className="text-center py-20 bg-card/20 rounded-2xl border border-dashed border-white/10">
            <LayoutGrid className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-medium mb-2">No ideas found</h3>
            <p className="text-muted-foreground mb-6">Your workspace is empty for this filter.</p>
            <Button onClick={() => setIsCreateOpen(true)}>Capture your first idea</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ideas.map((idea) => (
              <Link key={idea.id} href={`/ideas/${idea.id}`}>
                <Card className="group cursor-pointer bg-card border-white/5 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 overflow-hidden relative">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <Badge variant={idea.isUsed ? "secondary" : "default"} className="font-normal text-xs">
                        {idea.isUsed ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Circle className="h-3 w-3 mr-1" />}
                        {idea.isUsed ? "Used" : "Raw"}
                      </Badge>
                      {idea.branchCount > 0 && (
                        <Badge variant="outline" className="font-normal text-xs border-primary/30 text-primary bg-primary/5">
                          <GitBranch className="h-3 w-3 mr-1" />
                          {idea.branchCount}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl leading-tight group-hover:text-primary transition-colors line-clamp-2">
                      {idea.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {idea.insight || "No insight documented yet..."}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0 text-xs text-muted-foreground/60 flex items-center mt-auto">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(idea.createdAt).toLocaleDateString()}
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
