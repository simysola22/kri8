---
name: kri8 redesign decisions
description: Navigation redesign, theme overhaul, and glassmorphism system for the kri8 app
---

## Nav structure (Header.tsx)
- Two-tier: glass top bar (logo, search, bell, avatar+dropdown) + horizontal pill tabs below
- 7 nav tabs: Dashboard, Ideas (both → /dashboard), Calendar, Community, Messages, Trends, Exports, Settings
- Profile dropdown has ONLY: My Profile, Themes (submenu), Sign Out
- Mobile: hamburger expands vertical tab list; search icon opens fullscreen overlay
- Active state: `var(--glass-active)` background + `var(--glass-border)` border + primary-colored icon

## Glassmorphism system (index.css)
- CSS tokens on `:root`: `--glass-bg`, `--glass-border`, `--glass-hover`, `--glass-active`, `--glass-blur`
- Each theme overrides these tokens with its own tinted values
- `.glass-panel` utility = `background: var(--glass-bg); border: 1px solid var(--glass-border); backdrop-filter: blur(12px)`
- All pages' card borders migrated from hardcoded `border-white/10` → `glass-panel` class

## Themes (8 total — all dark)
Keep: Midnight Minimalist (default, navy+gold), Monochrome, Cyber (neon green), Aurora (purple), Ocean Deep
Add: Nature (forest green, animated float orbs), Sky (navy-blue, animated cloud drift), Crimson (luxury red/white)
Remove: Sunrise, Forest, Purple, Sepia, Sunset

**Why:** Brief specified this exact set. All 8 are dark-mode only; `applyTheme()` always sets `.dark` class.

## Animated backgrounds (AppLayout.tsx)
- Fixed-position `<NatureBackground>`, `<SkyBackground>`, `<AuroraBackground>` divs in AppLayout
- Default `opacity: 0`, made visible via CSS: `:root.theme-nature .theme-nature-show { opacity: 1 }`
- Animations are pure CSS keyframes (nature-float, sky-drift, aurora-wave) — no JS animation loops

## Debug code locations removed
- `dashboard.tsx`: removed two `useEffect` blocks with `console.group` + raw `fetch('/api/ideas')`
- `calendar.tsx`: removed two `useEffect` blocks with `console.group` + raw `fetch('/api/calendar-ideas')`

## Route: /exports
- New page `pages/exports.tsx` — shows export options (PPTX implemented, CSV "coming soon")
- Registered in App.tsx inside `ClerkProtect`
- Uses `exportIdeasToPptx` from `@/lib/exportPptx`

## How to apply
- Any new page must import AppLayout and wrap content in it
- Cards should use `glass-panel` class instead of `bg-card border-white/10`
- New themes: add to THEMES array in `lib/themes.ts` + CSS block in `index.css` + optional background component in AppLayout
