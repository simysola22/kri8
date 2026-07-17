import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useListIdeas, getListIdeasQueryKey } from "@workspace/api-client-react";
import { exportIdeasToPptx } from "@/lib/exportPptx";
import { useToast } from "@/hooks/use-toast";
import { Download, FileText, Presentation, Loader2 } from "lucide-react";
import { useState } from "react";

export default function ExportsPage() {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  const { data: ideas, isLoading } = useListIdeas(
    { parent_id: null },
    { query: { queryKey: getListIdeasQueryKey({ parent_id: null }) } }
  );

  const handlePptxExport = async () => {
    if (!ideas?.length) {
      toast({ title: "No ideas to export", description: "Capture some ideas first.", variant: "destructive" });
      return;
    }
    setExporting(true);
    try {
      await exportIdeasToPptx(ideas as any, "midnight-minimalist");
      toast({ title: "Export complete", description: `${ideas.length} ideas exported to PPTX.` });
    } catch {
      toast({ title: "Export failed", description: "Something went wrong.", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const exportOptions = [
    {
      id: "pptx",
      title: "PowerPoint Presentation",
      description: "Export all your ideas into a polished .pptx deck, ready to present.",
      icon: Presentation,
      badge: `${ideas?.length ?? 0} ideas`,
      action: handlePptxExport,
      available: true,
    },
    {
      id: "csv",
      title: "CSV Spreadsheet",
      description: "Export your idea library as a structured CSV file for analysis.",
      icon: FileText,
      badge: "Coming soon",
      action: () => {},
      available: false,
    },
  ];

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto flex flex-col gap-7">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Exports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Download your ideas in different formats.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {exportOptions.map(opt => {
            const Icon = opt.icon;
            return (
              <div
                key={opt.id}
                className="flex items-center gap-4 p-5 rounded-xl glass-panel"
                style={{ opacity: opt.available ? 1 : 0.55 }}
              >
                <div
                  className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "hsl(var(--primary) / 0.10)", border: "1px solid hsl(var(--primary) / 0.2)" }}
                >
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{opt.title}</p>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", color: "hsl(var(--muted-foreground))" }}
                    >
                      {isLoading ? "…" : opt.badge}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                </div>
                <Button
                  size="sm"
                  variant={opt.available ? "default" : "outline"}
                  onClick={opt.action}
                  disabled={!opt.available || exporting || isLoading}
                  className="shrink-0"
                  style={opt.available ? { boxShadow: "0 0 14px hsl(var(--primary) / 0.20)" } : {}}
                >
                  {exporting && opt.id === "pptx" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  <span className="ml-1.5">{opt.available ? "Export" : "Soon"}</span>
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
