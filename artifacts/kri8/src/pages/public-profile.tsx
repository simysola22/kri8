import { useParams } from "wouter";
import { useGetPublicProfile, getGetPublicProfileQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LayoutGrid, GitBranch, Calendar } from "lucide-react";
import { useEffect } from "react";
import { applyTheme } from "@/lib/themes";

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  
  const { data: profile, isLoading, error } = useGetPublicProfile(username, {
    query: { enabled: !!username, queryKey: getGetPublicProfileQueryKey(username) }
  });

  useEffect(() => {
    // Theme application removed: themePreference is not exposed on public profiles
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="animate-pulse w-16 h-16 rounded-full bg-primary/20"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-bold mb-2">Profile not found</h1>
        <p className="text-muted-foreground">The user may not exist or has not created any public ideas.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="h-64 bg-card border-b border-white/10 relative flex items-end">
        <div className="container mx-auto px-4 pb-8 flex items-end gap-6 relative z-10">
          <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-4xl font-bold shadow-xl border-4 border-background">
            {(profile.user.name || profile.user.username || "U").charAt(0).toUpperCase()}
          </div>
          <div className="pb-2">
            <h1 className="text-3xl md:text-4xl font-bold">{profile.user.name || profile.user.username}</h1>
            <p className="text-muted-foreground mt-1">@{profile.user.username}</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <LayoutGrid className="h-6 w-6 text-primary" />
          Public Ideas Gallery
        </h2>

        {!profile.ideas?.length ? (
          <div className="text-center py-20 bg-card/20 rounded-2xl border border-dashed border-white/10">
            <p className="text-muted-foreground">No ideas to display.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profile.ideas.map((idea) => (
              <Card key={idea.id} className="bg-card border-white/5 overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="font-normal text-xs border-white/10 text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(idea.createdAt).toLocaleDateString()}
                    </Badge>
                    {idea.branchCount > 0 && (
                      <Badge variant="secondary" className="font-normal text-xs">
                        <GitBranch className="h-3 w-3 mr-1" />
                        {idea.branchCount} branches
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl leading-tight line-clamp-2">
                    {idea.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed">
                    {idea.insight || "No public insight available."}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
