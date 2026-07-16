export const THEMES = [
  { id: "midnight-minimalist", name: "Midnight Minimalist", description: "Dark navy with gold accents", className: "theme-midnight" },
  { id: "sunrise-gradient", name: "Sunrise Gradient", description: "Warm morning tones", className: "theme-sunrise" },
  { id: "ocean-deep", name: "Ocean Deep", description: "Deep blue with subtle waves", className: "theme-ocean" },
  { id: "forest-green", name: "Forest Green", description: "Dark forest greens", className: "theme-forest" },
  { id: "purple-dream", name: "Purple Dream", description: "Soft lavender and floating shapes", className: "theme-purple" },
  { id: "aurora", name: "Aurora", description: "Animated northern lights", className: "theme-aurora" },
  { id: "cyber", name: "Cyber", description: "Dark with neon green and pink", className: "theme-cyber" },
  { id: "sepia-vintage", name: "Sepia Vintage", description: "Warm brown aged paper", className: "theme-sepia" },
  { id: "monochrome", name: "Monochrome", description: "Pure black and white", className: "theme-monochrome" },
  { id: "sunset", name: "Sunset", description: "Orange to purple gradient", className: "theme-sunset" },
];

export function applyTheme(themeId: string) {
  const root = document.documentElement;
  
  // Remove existing theme classes
  THEMES.forEach(t => root.classList.remove(t.className));
  
  const selectedTheme = THEMES.find(t => t.id === themeId) || THEMES[0];
  root.classList.add(selectedTheme.className);
  
  // Ensure dark mode base is applied if the theme requires it, but let's manage via CSS variables per class
  if (["midnight-minimalist", "ocean-deep", "forest-green", "aurora", "cyber", "monochrome"].includes(selectedTheme.id)) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}
