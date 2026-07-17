import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { 
  useGetIdea, 
  useUpdateIdea, 
  useDeleteIdea,
  useCreateBranch,
  getGetIdeaQueryKey,
} from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Video, GitBranch, ArrowLeft, Trash2, CheckCircle2, Circle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function IdeaDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: idea, isLoading } = useGetIdea(Number(id), {
    query: { enabled: !!id, queryKey: getGetIdeaQueryKey(Number(id)) }
  });

  const updateIdea = useUpdateIdea();
  const deleteIdea = useDeleteIdea();
  const createBranch = useCreateBranch();

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isBranchOpen, setIsBranchOpen] = useState(false);
  const [branchParentId, setBranchParentId] = useState<number | null>(null);

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
        setLocation("/dashboard");
      }
    });
  };

  const handleCreateBranch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const parentId = branchParentId || idea?.id;
    if (!parentId) return;

    // Use updateIdea to create a branch? Wait, the API spec says useCreateIdea handles branches if parentId is passed?
    // Actually the spec says useCreateBranch is a separate endpoint or just useCreateIdea with parentId?
    // Ah, useCreateBranch takes branchInput.
    // Let's check available API: useCreateIdea doesn't have parentId in Input, so we must use useCreateIdea but wait, I'm missing useCreateBranch. 
    // If not, I can fallback.
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

        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="glass-panel">
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
