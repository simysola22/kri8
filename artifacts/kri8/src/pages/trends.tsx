import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useGetTrendDashboard, useAnalyzeIdea, useInspireIdea, getGetTrendDashboardQueryKey } from "@workspace/api-client-react";
import { TrendingUp, Lightbulb, Sparkles, Hash, BarChart3, Search, ChevronUp, ChevronDown, Minus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type TrendingTopic = { topic: string; score: number; category: string; description: string; relatedHashtags?: string[] | null };
type TrendingHashtag = { hashtag: string; postCount: number; growthRate: number; platforms?: string[] | null };
type TrendDashboard = { trendingTopics: TrendingTopic[]; trendingHashtags: TrendingHashtag[]; lastUpdated: string; provider: string };
type AnalysisResult = { relevanceScore: number; matchedTopics: string[]; matchedHashtags: string[]; suggestion: string; estimatedReach: string };
type InspirationResult = { ideas: Array<{ title: string; angle: string; suggestedHashtags: string[] }> };

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? "text-emerald-400 bg-emerald-500/20" : score >= 50 ? "text-primary bg-primary/20" : "text-blue-400 bg-blue-500/20";
  return <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", color)}>{score}</span>;
}

function GrowthIndicator({ rate }: { rate: number }) {
  if (rate > 0.05) return <span className="flex items-center gap-0.5 text-emerald-400 text-xs"><ChevronUp className="h-3 w-3" />{(rate * 100).toFixed(0)}%</span>;
  if (rate < -0.05) return <span className="flex items-center gap-0.5 text-red-400 text-xs"><ChevronDown className="h-3 w-3" />{Math.abs(rate * 100).toFixed(0)}%</span>;
  return <span className="flex items-center gap-0.5 text-muted-foreground text-xs"><Minus className="h-3 w-3" />Stable</span>;
}

function formatCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export default function TrendsPage() {
  const { toast } = useToast();
  const [analyzeForm, setAnalyzeForm] = useState({ title: "", notes: "" });
  const [analyzeResult, setAnalyzeResult] = useState<AnalysisResult | null>(null);
  const [inspireForm, setInspireForm] = useState({ title: "", notes: "" });
  const [inspireResult, setInspireResult] = useState<InspirationResult | null>(null);

  const { data: dashboard, isLoading: dashLoading } = useGetTrendDashboard({
    query: { queryKey: getGetTrendDashboardQueryKey(), staleTime: 5 * 60 * 1000 },
  });

  const analyzeIdea = useAnalyzeIdea();
  const inspireIdea = useInspireIdea();

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!analyzeForm.title.trim()) return;
    analyzeIdea.mutate(
      { data: { title: analyzeForm.title, notes: analyzeForm.notes || undefined } },
      {
        onSuccess: (data) => setAnalyzeResult(data as unknown as AnalysisResult),
        onError: () => toast({ title: "Analysis failed", variant: "destructive" }),
      }
    );
  };

  const handleInspire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspireForm.title.trim()) return;
    inspireIdea.mutate(
      { data: { title: inspireForm.title, notes: inspireForm.notes || undefined } },
      {
        onSuccess: (data) => setInspireResult(data as unknown as InspirationResult),
        onError: () => toast({ title: "Inspiration failed", variant: "destructive" }),
      }
    );
  };

  const d = dashboard as TrendDashboard | undefined;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Trend Discovery</h1>
              <p className="text-muted-foreground mt-1">Ride what's trending. Create what's next.</p>
            </div>
          </div>
          {d && (
            <div className="text-right text-xs text-muted-foreground">
              <p className="font-medium capitalize">Provider: {d.provider}</p>
              <p>Updated {new Date(d.lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          )}
        </div>

        <Tabs defaultValue="dashboard">
          <TabsList className="bg-card border border-white/10">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-white/10">
              <BarChart3 className="h-4 w-4 mr-2" />Dashboard
            </TabsTrigger>
            <TabsTrigger value="analyze" className="data-[state=active]:bg-white/10">
              <Search className="h-4 w-4 mr-2" />Analyze Idea
            </TabsTrigger>
            <TabsTrigger value="inspire" className="data-[state=active]:bg-white/10">
              <Sparkles className="h-4 w-4 mr-2" />Get Inspired
            </TabsTrigger>
          </TabsList>

          {/* Dashboard tab */}
          <TabsContent value="dashboard" className="mt-4">
            {dashLoading ? (
              <div className="py-16 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : d ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Trending Topics */}
                <Card className="bg-card border-white/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Trending Topics
                    </CardTitle>
                    <CardDescription>Hot content themes right now</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {d.trendingTopics.map((topic, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm">{topic.topic}</p>
                            <ScoreBadge score={topic.score} />
                            <Badge variant="outline" className="border-white/20 text-xs text-muted-foreground">{topic.category}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{topic.description}</p>
                          {topic.relatedHashtags && topic.relatedHashtags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {topic.relatedHashtags.slice(0, 4).map(h => (
                                <span key={h} className="text-[10px] text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">#{h}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Trending Hashtags */}
                <Card className="bg-card border-white/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Hash className="h-5 w-5 text-blue-400" />
                      Trending Hashtags
                    </CardTitle>
                    <CardDescription>Tags driving discovery</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {d.trendingHashtags.map((tag, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                        <span className="text-sm font-bold text-blue-400 min-w-0 truncate">#{tag.hashtag}</span>
                        <div className="flex items-center gap-3 ml-auto shrink-0">
                          <span className="text-xs text-muted-foreground">{formatCount(tag.postCount)} posts</span>
                          <GrowthIndicator rate={tag.growthRate} />
                          {tag.platforms && tag.platforms.length > 0 && (
                            <div className="flex gap-1">
                              {tag.platforms.map(p => (
                                <Badge key={p} variant="outline" className="text-[10px] border-white/20 px-1.5 py-0">{p}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </TabsContent>

          {/* Analyze tab */}
          <TabsContent value="analyze" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card border-white/10">
                <CardHeader>
                  <CardTitle>Analyze Your Idea</CardTitle>
                  <CardDescription>See how your idea aligns with current trends.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAnalyze} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Idea Title</label>
                      <Input
                        placeholder="e.g. Morning routine for creators"
                        value={analyzeForm.title}
                        onChange={e => setAnalyzeForm(f => ({ ...f, title: e.target.value }))}
                        className="bg-background border-white/10 focus-visible:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Notes (optional)</label>
                      <Textarea
                        placeholder="Additional context about your idea..."
                        value={analyzeForm.notes}
                        onChange={e => setAnalyzeForm(f => ({ ...f, notes: e.target.value }))}
                        className="bg-background border-white/10 focus-visible:ring-primary resize-none"
                        rows={3}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      disabled={!analyzeForm.title.trim() || analyzeIdea.isPending}
                    >
                      {analyzeIdea.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyzing…</> : <><Search className="h-4 w-4 mr-2" />Analyze Trend Fit</>}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {analyzeResult ? (
                <Card className="bg-card border-white/10">
                  <CardHeader>
                    <CardTitle>Analysis Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                      <div>
                        <p className="text-sm text-muted-foreground">Trend Relevance</p>
                        <p className="text-3xl font-bold text-primary">{analyzeResult.relevanceScore}<span className="text-lg text-muted-foreground">/100</span></p>
                      </div>
                      <div className="w-16 h-16 rounded-full border-4 flex items-center justify-center"
                        style={{
                          borderColor: analyzeResult.relevanceScore >= 70 ? '#10b981' : analyzeResult.relevanceScore >= 40 ? '#d4af37' : '#6b7280',
                          background: `conic-gradient(currentColor ${analyzeResult.relevanceScore * 3.6}deg, transparent 0deg)`
                        }}
                      >
                        <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center">
                          <TrendingUp className={cn("h-5 w-5", analyzeResult.relevanceScore >= 70 ? "text-emerald-400" : analyzeResult.relevanceScore >= 40 ? "text-primary" : "text-muted-foreground")} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Matched Topics</p>
                      <div className="flex flex-wrap gap-2">
                        {analyzeResult.matchedTopics.length > 0
                          ? analyzeResult.matchedTopics.map(t => <Badge key={t} className="bg-primary/20 text-primary border-0">{t}</Badge>)
                          : <p className="text-sm text-muted-foreground">No matching topics found</p>}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Suggested Hashtags</p>
                      <div className="flex flex-wrap gap-1.5">
                        {analyzeResult.matchedHashtags.map(h => (
                          <span key={h} className="text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded">#{h}</span>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Recommendation</p>
                      <p className="text-sm">{analyzeResult.suggestion}</p>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Estimated Reach</span>
                      <span className="font-medium text-primary">{analyzeResult.estimatedReach}</span>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-card border-white/10 border-dashed">
                  <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mb-4 opacity-40" />
                    <p className="text-muted-foreground">Your analysis results will appear here</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Inspire tab */}
          <TabsContent value="inspire" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card border-white/10">
                <CardHeader>
                  <CardTitle>Creator Inspiration Engine</CardTitle>
                  <CardDescription>Let trends spark new content angles for you.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleInspire} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Your Topic or Niche</label>
                      <Input
                        placeholder="e.g. productivity, fitness, finance..."
                        value={inspireForm.title}
                        onChange={e => setInspireForm(f => ({ ...f, title: e.target.value }))}
                        className="bg-background border-white/10 focus-visible:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Style or Vibe (optional)</label>
                      <Textarea
                        placeholder="e.g. motivational, educational, comedic, day-in-the-life..."
                        value={inspireForm.notes}
                        onChange={e => setInspireForm(f => ({ ...f, notes: e.target.value }))}
                        className="bg-background border-white/10 focus-visible:ring-primary resize-none"
                        rows={3}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      disabled={!inspireForm.title.trim() || inspireIdea.isPending}
                    >
                      {inspireIdea.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating…</> : <><Sparkles className="h-4 w-4 mr-2" />Inspire Me</>}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {inspireResult ? (
                <Card className="bg-card border-white/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Content Ideas
                    </CardTitle>
                    <CardDescription>{inspireResult.ideas.length} ideas generated from current trends</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {inspireResult.ideas.map((idea, i) => (
                      <div key={i} className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 space-y-2">
                        <div className="flex items-start gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0 mt-0.5">
                            {i + 1}
                          </div>
                          <p className="font-medium text-sm">{idea.title}</p>
                        </div>
                        <p className="text-xs text-muted-foreground pl-8">{idea.angle}</p>
                        {idea.suggestedHashtags.length > 0 && (
                          <div className="pl-8 flex flex-wrap gap-1">
                            {idea.suggestedHashtags.map(h => (
                              <span key={h} className="text-[10px] text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">#{h}</span>
                            ))}
                          </div>
                        )}
                        <div className="pl-8">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-white/20 hover:bg-white/10"
                            onClick={() => {
                              setAnalyzeForm({ title: idea.title, notes: idea.angle });
                              toast({ title: "Idea copied to analyzer" });
                            }}
                          >
                            <Lightbulb className="h-3 w-3 mr-1" />
                            Analyze This
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-card border-white/10 border-dashed">
                  <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                    <Sparkles className="h-12 w-12 text-muted-foreground mb-4 opacity-40" />
                    <p className="text-muted-foreground">Trend-powered content ideas appear here</p>
                    <p className="text-xs text-muted-foreground mt-1">Enter your niche and let the engine do the work</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
