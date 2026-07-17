export const THEMES = [
  { id: "midnight-minimalist", name: "Midnight Minimalist", description: "Dark navy with gold accents", className: "theme-midnight" },
  { id: "monochrome", name: "Monochrome", description: "Pure black and white", className: "theme-monochrome" },
  { id: "cyber", name: "Cyber", description: "Dark with neon green", className: "theme-cyber" },
  { id: "aurora", name: "Aurora", description: "Northern lights", className: "theme-aurora" },
  { id: "ocean-deep", name: "Ocean Deep", description: "Deep blue waters", className: "theme-ocean" },
  { id: "nature", name: "Nature", description: "Peaceful premium green", className: "theme-nature" },
  { id: "sky", name: "Sky", description: "Open blue sky", className: "theme-sky" },
  { id: "crimson", name: "Crimson", description: "Luxury red & white", className: "theme-crimson" },
];

export function applyTheme(themeId: string) {
  const root = document.documentElement;
  THEMES.forEach(t => root.classList.remove(t.className));
  const selected = THEMES.find(t => t.id === themeId) || THEMES[0];
  root.classList.add(selected.className);
  // All 8 themes are dark-mode by design
  root.classList.add("dark");
}
