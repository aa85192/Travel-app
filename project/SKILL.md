---
name: cindys-world-design
description: Use this skill to generate well-branded interfaces and assets for Cindy's World (a personal Korea travel-planner app, macaron-pink, bear-illustrated, ENFJ-coded, Apple-aesthetic). Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick reference

**Brand**: Cindy's Paradise / Cindy's World — a personal Korea travel-planner app for one 25-year-old ENFJ designer-user. Mood: macaron-pink, social-media-cute, Apple-precise.

**Files**
- `README.md` — full system: context, copy voice, visual foundations, iconography, sources
- `colors_and_type.css` — every CSS variable (colors + semantic type)
- `fonts/` — webfonts (Nunito display, Noto Sans TC body, DM Mono numerics)
- `assets/bear-icons/` — 6 PNG bear icons for bottom-nav (home, itinerary, LIST, MAP, COST, SETTING)
- `assets/stickers/` — 16 bear illustration PNGs for empty states, celebrations, errors
- `preview/*.html` — design-system specimen cards (one concept each)
- `ui_kits/cindys-world/` — interactive recreation of the app in a 390×844 phone frame

**Core palette**
- Primary: `--color-milk-tea-500` `#FF6FA3` (macaron pink)
- Surface: `--color-milk-tea-50` `#FFF8FA`
- Ink: `--color-neutral-dark` `#2D2030`
- Accents: coral `#FFD4B8`, lavender `#AAB6FB`, sage `#99F2E6`, sky `#B8DCFF`, cream `#FFFEE1`

**Typography**
- Display: Nunito 700/800
- Body: Noto Sans TC 400/500/700 (Traditional Chinese first; English secondary)
- Numerics: DM Mono — for prices, times, flight codes, dates
- Headings always tinted with `--color-milk-tea-900` `#6B1A3C`

**Voice**
- Traditional Chinese, conversational, lots of soft particles (`～`, `吧`, `喔`)
- Kaomoji and emoji used liberally in headings, never in body copy
- Short, like a girl talking to herself: "今天要去哪兒～", "收到!", "還有 32 天"
- Numbers always tabular (DM Mono) and currency-prefixed (`KRW 9,000`, `₩1,400`)

**Visuals**
- Backgrounds: warm pink wash `#FFF8FA`, never pure white
- Cards: 24–28px radius, 1px `#FED7DD` border, soft `0 2px 20px rgba(0,0,0,0.06)` shadow
- Photos: 14px radius (`--radius-photo`)
- Buttons: pill-shaped (9999px radius), pink fills, never sharp corners
- Bear PNGs are the iconography — never substitute with line icons for nav. Lucide line icons OK for chrome (close, plus, edit, chevrons).

## When designing

1. Read `README.md` end-to-end — it answers "what color, what font, what voice, what tone".
2. Look at `ui_kits/cindys-world/index.html` for component composition patterns.
3. Pull bear stickers liberally for empty states and emotional moments. The bear is the soul of the brand.
4. Always write copy in Traditional Chinese first; English is secondary.
5. Numbers and times must use DM Mono with `font-variant-numeric: tabular-nums`.
6. Never use bluish-purple gradients, generic stock SVG icons, or harsh drop shadows.
