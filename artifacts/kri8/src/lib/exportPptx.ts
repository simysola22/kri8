import pptxgen from "pptxgenjs";
import { IdeaDetail } from "@workspace/api-client-react";

export async function exportIdeasToPptx(ideas: IdeaDetail[], themeId: string) {
  const pptx = new pptxgen();
  
  // Basic theme mapping
  const themeColors: Record<string, { bg: string, text: string, accent: string }> = {
    "midnight-minimalist": { bg: "1a1f35", text: "ffffff", accent: "d4af37" },
    "sunrise-gradient": { bg: "ffedd5", text: "1f2937", accent: "f97316" },
    "ocean-deep": { bg: "001f3f", text: "ffffff", accent: "38bdf8" },
    "forest-green": { bg: "0B3D2C", text: "ffffff", accent: "4ade80" },
    "purple-dream": { bg: "E6D5F0", text: "1f2937", accent: "a855f7" },
    "aurora": { bg: "0f172a", text: "ffffff", accent: "8b5cf6" },
    "cyber": { bg: "1a1a1a", text: "ffffff", accent: "39FF14" },
    "sepia-vintage": { bg: "fef3c7", text: "451a03", accent: "b45309" },
    "monochrome": { bg: "000000", text: "ffffff", accent: "ffffff" },
    "sunset": { bg: "4c0519", text: "ffffff", accent: "f43f5e" },
  };

  const colors = themeColors[themeId] || themeColors["midnight-minimalist"];

  pptx.layout = "LAYOUT_16x9";
  
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: colors.bg };
  titleSlide.addText("kri8 Ideas Export", {
    x: "10%", y: "40%", w: "80%", h: "20%",
    fontSize: 44, color: colors.text, bold: true, align: "center"
  });

  const addIdeaToSlide = (idea: any, level: number = 0) => {
    const slide = pptx.addSlide();
    slide.background = { color: colors.bg };
    
    // Title
    slide.addText(`${"  ".repeat(level)}${idea.title}`, {
      x: "5%", y: "5%", w: "90%", h: "10%",
      fontSize: 28 - (level * 2), color: colors.accent, bold: true
    });

    let yPos = 15;
    
    // Insight
    if (idea.insight) {
      slide.addText("Insight: " + idea.insight, {
        x: "5%", y: `${yPos}%`, w: "90%", h: "15%",
        fontSize: 18, color: colors.text, italic: true
      });
      yPos += 15;
    }

    // Origin
    if (idea.origin) {
      slide.addText("Origin: " + idea.origin, {
        x: "5%", y: `${yPos}%`, w: "90%", h: "10%",
        fontSize: 14, color: colors.text
      });
      yPos += 10;
    }

    // Notes
    if (idea.notes) {
      slide.addText("Notes:\n" + idea.notes, {
        x: "5%", y: `${yPos}%`, w: "42%", h: "40%",
        fontSize: 14, color: colors.text, valign: "top"
      });
    }

    // Video Editing Notes
    if (idea.videoEditingNotes) {
      slide.addText("Video Editing:\n" + idea.videoEditingNotes, {
        x: "53%", y: `${yPos}%`, w: "42%", h: "40%",
        fontSize: 14, color: colors.text, valign: "top"
      });
    }
    
    // Dates
    const datesText = [
      idea.createdDate ? `Created: ${new Date(idea.createdDate).toLocaleDateString()}` : '',
      idea.usedDate ? `Used: ${new Date(idea.usedDate).toLocaleDateString()}` : '',
      idea.customDate ? `Custom: ${new Date(idea.customDate).toLocaleDateString()}` : ''
    ].filter(Boolean).join(" | ");
    
    if (datesText) {
      slide.addText(datesText, {
        x: "5%", y: "90%", w: "90%", h: "5%",
        fontSize: 10, color: colors.text, align: "right"
      });
    }

    // Process branches
    if (idea.branches && idea.branches.length > 0) {
      idea.branches.forEach((branch: any) => addIdeaToSlide(branch, level + 1));
    }
  };

  ideas.forEach(idea => addIdeaToSlide(idea, 0));

  await pptx.writeFile({ fileName: `kri8-export-${new Date().toISOString().split('T')[0]}.pptx` });
}
