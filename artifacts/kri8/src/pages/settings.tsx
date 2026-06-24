import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { THEMES, applyTheme } from "@/lib/themes";
import { useGetMe, useUpdateMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Check, Copy, ExternalLink } from "lucide-react";

export default function Settings() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const updateMe = useUpdateMe();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    username: ""
  });
  
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        username: user.username || ""
      });
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMe.mutate({
      data: {
        name: formData.name,
        username: formData.username
      }
    }, {
      onSuccess: () => {
        toast({ title: "Profile updated successfully" });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      }
    });
  };

  const handleThemeSelect = (themeId: string) => {
    applyTheme(themeId);
    updateMe.mutate({
      data: { themePreference: themeId }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      }
    });
  };

  const copyProfileLink = () => {
    if (!user?.username) return;
    const url = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}/profile/${user.username}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">Settings</h1>

        <Card className="bg-card border-white/10">
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>Manage your public identity and sharing settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="bg-background border-white/10 max-w-md"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="flex gap-2 max-w-md">
                  <Input 
                    id="username" 
                    value={formData.username} 
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="bg-background border-white/10"
                    placeholder="creative-mind"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">This will be used for your public profile URL.</p>
              </div>

              {user?.username && (
                <div className="pt-4 border-t border-white/10">
                  <Label>Public Profile Link</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="px-3 py-2 bg-background border border-white/10 rounded-md text-sm text-primary flex-1 max-w-md overflow-hidden text-ellipsis">
                      {window.location.origin}{import.meta.env.BASE_URL.replace(/\/$/, "")}/profile/{user.username}
                    </code>
                    <Button type="button" variant="secondary" size="icon" onClick={copyProfileLink}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button type="button" variant="outline" size="icon" asChild>
                      <a href={`/profile/${user.username}`} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              )}

              <Button type="submit" disabled={updateMe.isPending}>
                {updateMe.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-card border-white/10">
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Choose your workspace vibe. Themes sync across your devices.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeSelect(theme.id)}
                  className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all ${
                    user?.themePreference === theme.id 
                      ? "border-primary bg-primary/5 ring-1 ring-primary" 
                      : "border-white/10 bg-background/50 hover:border-white/30"
                  }`}
                >
                  <span className="font-semibold">{theme.name}</span>
                  <span className="text-xs text-muted-foreground mt-1">{theme.description}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
