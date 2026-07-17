import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { THEMES, applyTheme } from "@/lib/themes";
import { useGetMe, useUpdateMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Check, Copy, ExternalLink } from "lucide-react";

export default function Settings() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const updateMe = useUpdateMe();
  const { toast } = useToast();

  const [formData, setFormData] = useState({ name: "", username: "" });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) setFormData({ name: user.name || "", username: user.username || "" });
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMe.mutate({ data: { name: formData.name, username: formData.username } }, {
      onSuccess: () => {
        toast({ title: "Profile updated" });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      },
      onError: () => toast({ title: "Update failed", variant: "destructive" }),
    });
  };

  const handleThemeSelect = (themeId: string) => {
    applyTheme(themeId);
    updateMe.mutate({ data: { themePreference: themeId } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() }),
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
      <div className="max-w-2xl mx-auto flex flex-col gap-7">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

        {/* Profile details */}
        <section
          className="rounded-xl p-6 glass-panel"
        >
          <h2 className="font-semibold mb-1">Profile</h2>
          <p className="text-sm text-muted-foreground mb-5">Manage your public identity.</p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="bg-background border-[var(--glass-border)]"
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  className="bg-background border-[var(--glass-border)]"
                  placeholder="creative-mind"
                />
                <p className="text-[11px] text-muted-foreground">Used for your public profile URL.</p>
              </div>
            </div>

            {user?.username && (
              <div className="pt-3 border-t border-[var(--glass-border)]">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Public Profile Link</Label>
                <div className="flex items-center gap-2 mt-2">
                  <code className="flex-1 px-3 py-2 text-xs rounded-lg overflow-hidden text-ellipsis text-primary"
                    style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}>
                    {window.location.origin}{import.meta.env.BASE_URL.replace(/\/$/, "")}/profile/{user.username}
                  </code>
                  <Button type="button" variant="outline" size="icon" className="h-8 w-8 border-[var(--glass-border)]" onClick={copyProfileLink}>
                    {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                  <Button type="button" variant="outline" size="icon" className="h-8 w-8 border-[var(--glass-border)]" asChild>
                    <a href={`/profile/${user.username}`} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                </div>
              </div>
            )}

            <Button type="submit" size="sm" disabled={updateMe.isPending}>
              {updateMe.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </form>
        </section>

        {/* Theme picker */}
        <section className="rounded-xl p-6 glass-panel">
          <h2 className="font-semibold mb-1">Appearance</h2>
          <p className="text-sm text-muted-foreground mb-5">Choose your workspace theme. Synced across devices.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {THEMES.map(theme => {
              const active = user?.themePreference === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => handleThemeSelect(theme.id)}
                  className="relative flex flex-col items-start p-3 rounded-xl text-left transition-all duration-150"
                  style={{
                    background: active ? "var(--glass-active)" : "var(--glass-bg)",
                    border: `1px solid ${active ? "hsl(var(--primary) / 0.5)" : "var(--glass-border)"}`,
                    boxShadow: active ? "0 0 12px hsl(var(--primary) / 0.15)" : "none",
                  }}
                >
                  {active && (
                    <Check className="absolute top-2 right-2 h-3 w-3 text-primary" />
                  )}
                  <span className="text-sm font-semibold leading-snug">{theme.name}</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{theme.description}</span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
