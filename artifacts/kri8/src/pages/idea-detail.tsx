import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { 
  useGetIdea, 
  useUpdateIdea, 
  useDeleteIdea,
  useCreateBranch,
  useListBranches,
  getGetIdeaQueryKey,
  getListBranchesQueryKey,
  getListIdeasQueryKey,
  getGetIdeaStatsQueryKey,
} from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Video, GitBranch, ArrowLeft, Trash2, CheckCircle2, Circle, Clock, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export default function IdeaDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: idea, isLoading } = useGetIdea(Number(id), {
    query: { enabled: !!id, queryKey: getGetIdeaQueryKey(Number(id)) }
  });

  const { data: branches = [] } = useListBranches(Number(id), {
    query: { enabled: !!id, queryKey: getListBranchesQueryKey(Number(id)) }
  });

  const updateIdea = useUpdateIdea();
  const deleteIdea = useDeleteIdea();
  const createBranch = useCreateBranch();

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isBranchOpen, setIsBranchOpen] = useState(false);

  const [editFields, setEditFields] = useState({
    title: "",
    insight: "",
    origin: "",
    notes: "",
    videoEditingNotes: ""
  });

  useEffect(() => {
    if (idea) {
      setEditFields({
        title: idea.title,
        insight: idea.insight || "",
        origin: idea.origin || "",
        notes: idea.notes || "",
        videoEditingNotes: idea.videoEditingNotes || ""
      });
    }
  }, [idea]);

  const handleUpdate = (field: keyof typeof editFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditFields(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleBlur = (field: keyof typeof editFields) => () => {
    if (!idea) return;
    if (editFields[field] !== idea[field as keyof typeof idea]) {
      updateIdea.mutate({
        id: idea.id,
        data: { [field]: editFields[field] }
      }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetIdeaQueryKey(idea.id) })
      });
    }
  };

  const handleToggleUsed = () => {
    if (!idea) return;
    updateIdea.mutate({
      id: idea.id,
      data: { isUsed: !idea.isUsed, usedDate: !idea.isUsed ? new Date().toISOString() : undefined }
    }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetIdeaQueryKey(idea.id) })
    });
  };

  const handleDelete = () => {
    if (!idea) return;
    deleteIdea.mutate({ id: idea.id }, {
      onSuccess: () => {
        toast({ title: "Idea deleted" });
        queryClient.invalidateQueries({ queryKey: getListIdeasQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetIdeaStatsQueryKey() });
        setLocation("/dashboard");
      }
    });
  };

  const handleCreateBranch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!idea) return;
    const formData = new FormData(e.currentTarget);
    const title = (formData.get("branch-title") as string).trim();
    if (!title) return;

    createBranch.mutate({
      id: idea.id,
      data: {
        title,
        insight: (formData.get("branch-insight") as string).trim() || undefined,
      }
    }, {
      onSuccess: (newBranch) => {
        setIsBranchOpen(false);
        queryClient.invalidateQueries({ queryKey: getGetIdeaQueryKey(idea.id) });
        queryClient.invalidateQueries({ queryKey: getListBranchesQueryKey(idea.id) });
        queryClient.invalidateQueries({ queryKey: getListIdeasQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetIdeaStatsQueryKey() });
        toast({ title: "Branch created", description: `"${newBranch.title}" added as a branch.` });
      },
      onError: () => toast({ title: "Failed to create branch", variant: "destructive" }),
    });
  };

  if (isLoading) return <AppLayout><div className="animate-pulse h-96 bg-card/40 rounded-xl" /></AppLayout>;
  if (!idea) return <AppLayout><div>Not found</div></AppLayout>;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Button variant="ghost" onClick={() => setLocation("/dashboard")} className="pl-0 hover:bg-transparent hover:text-primary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsBranchOpen(true)} className="border-white/10">
              <GitBranch className="h-4 w-4 mr-2" />
              Branch
              {(branches as any[]).length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {(branches as any[]).length}
                </Badge>
              )}
            </Button>
            <Button variant={idea.isUsed ? "outline" : "default"} onClick={handleToggleUsed} className="w-full sm:w-auto">
              {idea.isUsed ? <CheckCircle2 className="h-4 w-4 mr-2 text-primary" /> : <Circle className="h-4 w-4 mr-2" />}
              {idea.isUsed ? "Marked Used" : "Mark as Used"}
            </Button>
            <Button variant="destructive" size="icon" onClick={() => setIsDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="space-y-6">
          <Input 
            className="text-4xl md:text-5xl font-black bg-transparent border-transparent px-0 focus-visible:ring-0 focus-visible:border-white/20 h-auto py-2 placeholder:text-muted"
            value={editFields.title}
            onChange={handleUpdate("title")}
            onBlur={handleBlur("title")}
            placeholder="Untitled Idea"
          />

          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground items-center bg-card/30 p-3 rounded-lg border border-white/5">
            <div className="flex items-center gap-1.5 bg-background/50 px-2 py-1 rounded">
              <Clock className="h-3.5 w-3.5" />
              <span>Created: {new Date(idea.createdDate).toLocaleDateString()}</span>
            </div>
            {idea.usedDate && (
              <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-2 py-1 rounded">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Used: {new Date(idea.usedDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          <div className="grid gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-primary tracking-widest uppercase">The Insight</label>
              <Textarea 
                className="min-h-[120px] bg-card border-white/10 text-lg resize-none p-4 rounded-xl leading-relaxed focus-visible:ring-primary"
                value={editFields.insight}
                onChange={handleUpdate("insight")}
                onBlur={handleBlur("insight")}
                placeholder="What is the core realization?"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-primary tracking-widest uppercase flex items-center gap-2">
                  Notes
                </label>
                <Textarea 
                  className="min-h-[200px] bg-card border-white/10 resize-none p-4 rounded-xl"
                  value={editFields.notes}
                  onChange={handleUpdate("notes")}
                  onBlur={handleBlur("notes")}
                  placeholder="Additional context, links, thoughts..."
                />
              </div>

              <div className="space-y-2 relative group">
                <label className="text-sm font-bold text-primary tracking-widest uppercase flex items-center gap-2">
                  <Video className="h-4 w-4" /> Video Editing Notes
                </label>
                <Textarea 
                  className="min-h-[200px] bg-card border-white/10 resize-none p-4 rounded-xl font-mono text-sm"
                  value={editFields.videoEditingNotes}
                  onChange={handleUpdate("videoEditingNotes")}
                  onBlur={handleBlur("videoEditingNotes")}
                  placeholder="B-roll ideas, pacing, music vibe, transitions..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Branches Section */}
        {(branches as any[]).length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-sm tracking-widest uppercase text-primary">Branches</h3>
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">{(branches as any[]).length}</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {(branches as any[]).map((branch: any) => (
                <Link key={branch.id} href={`/ideas/${branch.id}`}>
                  <Card className="group cursor-pointer bg-card/50 border-white/5 hover:border-primary/40 transition-all duration-200">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <GitBranch className="h-3 w-3 text-muted-foreground shrink-0" />
                        <CardTitle className="text-sm font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                          {branch.title}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    {branch.insight && (
                      <CardContent className="pt-0 pb-3">
                        <p className="text-xs text-muted-foreground line-clamp-2">{branch.insight}</p>
                      </CardContent>
                    )}
                  </Card>
                </Link>
              ))}
              <button
                onClick={() => setIsBranchOpen(true)}
                className="flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-white/10 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors text-sm"
              >
                <Plus className="h-4 w-4" />
                Add branch
              </button>
            </div>
          </div>
        )}

        {/* Branch Dialog */}
        <Dialog open={isBranchOpen} onOpenChange={setIsBranchOpen}>
          <DialogContent className="sm:max-w-[480px] bg-card border-white/10">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-primary" />
                Create a Branch
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground -mt-2">
              Branch off from <span className="text-foreground font-medium">"{idea.title}"</span> with a new angle or variation.
            </p>
            <form onSubmit={handleCreateBranch} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <Label htmlFor="branch-title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="branch-title"
                  name="branch-title"
                  required
                  autoFocus
                  placeholder="What's the variation or new angle?"
                  className="bg-background border-white/10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="branch-insight">Insight</Label>
                <Textarea
                  id="branch-insight"
                  name="branch-insight"
                  placeholder="What's different about this branch?"
                  className="bg-background border-white/10 min-h-[80px] resize-none"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsBranchOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createBranch.isPending}>
                  {createBranch.isPending ? "Creating…" : "Create Branch"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="bg-card border-white/10">
            <DialogHeader>
              <DialogTitle>Delete this idea?</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">This will permanently delete "{idea.title}" and all of its branches. This action cannot be undone.</p>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleteIdea.isPending}>
                {deleteIdea.isPending ? "Deleting..." : "Delete Permanently"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </AppLayout>
  );
}
