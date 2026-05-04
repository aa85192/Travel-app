# Cindy's World — Korea Travel App Design System

> 🎀✨ **Cindy's Paradise** ☁️💖 — a personal Korea-trip planner for a 25-year-old ENFJ girl who loves Apple's design language and shares everything to social media.

A tiny, sweet, Apple-Wallet-meets-LINE-stickers design system. The product is a single-user planner mobile web app (React 19 + Tailwind v4 + Framer Motion) that organizes flights, itineraries, budgets, maps, todos and link-collections (IG / 小紅書 / Threads) for trips to Korea.

---

## Sources

- **Codebase**: [github.com/aa85192/Travel-app](https://github.com/aa85192/Travel-app) — `main` branch, snapshot @ `2225423a`. Vite + React 19 + Tailwind v4 + Framer Motion + dnd-kit + zustand. Synced to a Cloudflare Worker.
- **AI Studio app**: https://ai.studio/apps/47db1037-e64d-4f3b-9a27-9936643c7d75
- **Sticker uploads**: 80 LINE-style brown-bear stickers (set 1: simple round, set 2: with Traditional Chinese captions). Stored in `assets/stickers/`.
- **Bear nav icons**: 6 PNGs (首頁/行程/LIST/MAP/COST/SETTING) from `public/bears/` of the source repo. Stored in `assets/bear-icons/`.

---

## Index

| File | What's in it |
|---|---|
| `README.md` | This file — brand, content & visual rules |
| `colors_and_type.css` | All color + type CSS variables, semantic surface tokens |
| `SKILL.md` | Cross-compatible Agent Skill manifest |
| `assets/stickers/` | 18 curated brown-bear stickers (LINE-style) |
| `assets/bear-icons/` | 6 PNG nav icons (bear + house/clipboard/map-pin/coin/checklist/gear) |
| `preview/` | Design System tab cards (colors, type, components) |
| `ui_kits/cindys-world/` | Hi-fi React UI kit + interactive index.html |

There are no slide decks; this product has no marketing-deck surface yet.

---

## Product Context

**Name**: Cindy's Paradise (header reads `🎀✨Cindy's Paradise☁️💖`)
**Owner**: Cindy — 25, ENFJ, female, Taiwanese, Apple-aesthetic-loving, social-media-native.
**Origin destination**: Kaohsiung (KHH) → Busan/Seoul (PUS / 金海國際機場).
**Core trip in sample data**: 首爾五天四夜 ☕ (Seoul, 5 days 4 nights, 2026-06-05 → 2026-06-09).
**Auth**: a personal `PasswordGate` — this is intentionally a one-user app.

### Surfaces (tabs)
1. **首頁 (Home)** — hero trip card, swipeable Apple-Wallet flight tickets, donut-chart shared-expenses, accommodation & link collections.
2. **行程 (Itinerary)** — day-by-day spot cards with photos, transit cards between spots, drag-to-reorder mode, weather strip.
3. **待辦 (Todo)** — pre-trip checklist (visa, currency, packing).
4. **地圖 (Map)** — all spots pinned, day filtered.
5. **預算 (Budget)** — shared expenses, payer-splits, multi-currency.
6. **設定 (Settings)** — theme hue picker (color-wheel!), dark mode, password change, sticker icon overrides.

---

## Content Fundamentals

The voice is **a 25-year-old Taiwanese girl writing for herself in her own diary**. It's warm, slightly self-deprecating, and very emoji-heavy — but the emojis come from a curated personal palette, not generic "👍✨🎉" spam.

### Language
- **Traditional Chinese (繁體中文)** — primary. Casual, verb-leaning, no formal openers.
- **Korean** — used for `nameLocal` of every Korean spot (`경복궁`, `홍대거리`). Always paired with Chinese name, never standalone.
- **English** — only for: airline codes (KHH/PUS), brand names (Air Busan, Jeju Air), occasional micro-tagline. Never replaces Chinese for primary copy.

### Tone
- **First person, casual, intimate.** Notes read like Notes-app entries:
  > 「建議穿韓服免費入場！光化門守衛交接 10:00/14:00」
  > 「澡堂風格咖啡廳，蒙布朗很有名！」
  > 「五月有漢江煙火節，傍晚景色超美！」
- **Exclamation marks are common.** Three or four per screen is normal.
- **No "you" — everything is "我" or omitted subject.** This is a journal, not a service.
- **Self-deprecating bear stickers**: 我就爛 ("I just suck") · 吃土 ("eating dirt" = broke) · 殘破不堪 ("falling apart"). The user laughs at her own travel-planning stress.

### Casing
- Chinese has no case. **All-caps is reserved for English airport codes** (KHH, PUS) and tab acronyms (LIST, MAP, COST, SETTING).
- English mixed-in copy is **Title Case for products** (Air Busan), **lowercase for descriptions**.
- Sticker file names are `首頁` / `行程` (Chinese) AND `LIST` / `MAP` / `COST` / `SETTING` (uppercase English) — both conventions live side-by-side.

### Emoji usage — **YES, heavy**
This is the unusual one. Emoji are **structural**, not decorative. They:
- **Replace icons** in trip titles: `首爾五天四夜 ☕` · `古宮巡禮 🏯` · `弘大 & 明洞 🛍️` · `漢江 & 樂天世界 🎡`
- **Tag categories**: 🗺️ 景點 · 🍜 美食 · ☕ 咖啡廳 · 👗 衣服
- **Annotate transit row**: 🎒 (carry-on) · 🧳 (checked)
- **Identify travel partners**: 🐱 我 · 🐰 小美 · 🐻 阿強
- **Decorate the app title**: 🎀✨...☁️💖

**Rules:**
1. One emoji per item. Never more than two adjacent.
2. The emoji is part of the noun. `首爾五天四夜 ☕` not `☕ 首爾五天四夜`.
3. Brand emoji (🎀💖☁️✨) only appear in the home header and the persona description. Don't sprinkle them on functional UI.
4. **Icon-grade emoji** (the bear PNGs, lucide-react glyphs) are used **inside structural UI** (tabs, buttons). **Decorative emoji** (🎀✨💖) only in copy.

### Sticker captions (from uploads)
The 778xxx sticker set has hand-lettered Chinese captions on a butter-cream background. These are the brand voice in concentrate:
- 「收到!」 (got it / received)
- 「我就爛」 (I just suck) — self-deprecating beat
- 「花錢買快樂」 (pay-for-happiness)
- 「吃土」 (lit. eating dirt — Taiwanese slang for "broke")
- 「讓我睡」 (let me sleep)
- 「殘破不堪」 (in tatters)
- 「I love my job」 (English flex)

Use these stickers as **empty-state hero illustrations** and **end-of-flow celebrations**. Never as functional icons.

---

## Visual Foundations

### Color philosophy
The palette is **macaron** — every accent is high-value and low-saturation, sitting around 70–95% L*. There are **zero pure grays** — even neutrals are warm-tinted (`#F5EDEF`). Black is replaced with `#2D2030` (a near-black plum). Pure white is replaced with `#FFFAFC` (a hint of pink).

**Primary scale** is the milk-tea pink: `#FFF8FA → #6B1A3C` (10 stops). `500` (`#FF6FA3`) is the brand pink — used for primary CTAs, active tabs, the "已花" donut center label.

**Six accent pastels** rotate as category colors (cafés peach, restaurants periwinkle, hotels baby blue, etc.). Categories are color-coded *consistently* across map pins, expense donuts, and category badges.

**Dark mode** (`:root[data-theme="dark"]`) inverts neutrals to a hsl(340) plum scale and dims accents — the milk-tea hue is overridden inline by `settingsStore` because the user can pick their own primary hue with a color-wheel picker.

### Typography
Three families, with very specific roles:
- **Nunito** (display, 400/600/700/800) — soft rounded sans, used for headings and Latin numerals. The "8" and "0" have closed counters that match the cute round vibe. Set on `h1-h6` and on `tabular-nums` flight-time numerics.
- **Noto Sans TC** (body, 300/400/500/700) — Traditional Chinese body. Pairs well with Nunito because both have circular terminals.
- **DM Mono** (400/500) — used for: airport codes (KHH), prices (`KRW 75,000`), URLs in link cards, and any micro-meta where digit alignment matters.

Headings are nearly always `font-extrabold` (800) with `letter-spacing: -0.01em`. Body is `font-bold` (700) for labels and `font-medium` (500) for meta — there's a strong **bold-or-medium** rhythm; regular weights are rare.

### Backgrounds & textures
- **No background images** on chrome. The app fill is solid `--color-milk-tea-50` (#FFF8FA).
- **Hero photographs** (Unsplash Korea travel shots) are the only image surfaces — used as full-width covers for the trip card and per-spot cards.
- **No gradients** anywhere except: (a) bottom-up black overlay on hero photos (`bg-gradient-to-t from-black/75 via-black/20 to-transparent` for legibility), (b) optional sticker-cream cards.
- **No repeating patterns or grain.** No noise textures. Surfaces are flat.
- **Backdrop blur** is reserved for two places: bottom nav (`backdrop-blur-md` over `bg-white/95`) and the floating "還有 N 天" / location pills on the hero photo (`bg-white/20 backdrop-blur-md`).

### Animation
- Engine: **`motion/react`** (Framer Motion).
- Page transitions: 0.3s, slide-X ±20px + fade. The Map tab uses 0.25s and the Settings/Budget tabs use slide-Y instead of slide-X.
- Bottom-nav active indicator: **spring** `stiffness: 420, damping: 22` — punchy but not bouncy. The active bear scales to 1.18 and lifts `-3px` Y.
- Pill selectors: `layoutId="nav-dot"` for the active dot — it slides between tabs.
- Photo card press: `whileTap={{ scale: 0.985 }}` — barely-there tap feedback.
- AnimatePresence for collapsible link rows: 0.18s height-auto crossfade.

**Never used**: bounces, rubber-band overshoot, `easeInBack`, parallax, scroll-driven animations.

### Hover & press states
This is a **mobile-first** PWA so hover is rare. When present:
- **Hover** → background steps one shade in the milk-tea scale (`hover:bg-milk-tea-100` on a `bg-milk-tea-50` surface; `hover:text-milk-tea-600` on text).
- **Press** → `whileTap={{ scale: 0.985 }}` for hero cards; `scale: 0.95` for icon buttons. No color flash.
- **Active tab** → primary pink fill + white text + active dot slides under the icon.
- **Disabled** → not common; uses `opacity: 0.4`.

### Borders
Borders are **always 1px** and almost always `--color-milk-tea-100` (`#FED7DD` — pink at 90% L*). They're so soft they read as a card edge rather than a divider. Inputs use the same border on `--color-milk-tea-50` fills — the input shape registers from the slight contrast more than from the line.

Dashed borders: only for **empty / add-new** states (`border-dashed border-milk-tea-200`).

### Shadows
Three depths, all peachy-tinted:
1. **`--shadow-md`** = `0 2px 20px rgba(0,0,0,0.06)` — Apple-Wallet card shadow. Most cards use this.
2. **`--shadow-sm`** = `0 2px 8px rgba(255,111,163,0.06)` — utility chips, list rows.
3. **`--shadow-glow`** = `0 0 20px rgba(255,172,187,0.30)` — hero photographs and active CTA buttons.

No inner shadows. No multi-layered Material-style shadows.

### Corner radii
Generous and Apple-y:
- **`28–32px`** (`rounded-3xl`) — hero photos, flight cards, donut card, big modal sheets.
- **`24px`** (`rounded-2xl`) — content cards, list rows, inputs sometimes.
- **`14–18px`** (`rounded-xl`) — pills, smaller chips, photo thumbnails.
- **`9999px`** (`rounded-full`) — pills, dots, the day-counter chip, all icon buttons.

Never sharp corners. Even at 8px, things should feel pebble-smooth.

### Layout
- **Single column, max-width 28rem (448px)** — the whole app is a phone-shaped container, even on desktop. Centered with `mx-auto` and a faint outer shadow `shadow-2xl`.
- **Fixed full-viewport shell** (`fixed inset-0`) with `flex-col`. Only `.scroll-area` scrolls — bottom nav stays put on iOS PWA without rubber-band.
- **`pt-safe` and `pb-safe`** for env-aware safe areas; `paddingTop: 'calc(env(safe-area-inset-top, 0px) + 2.5rem)'` on the home header.
- **6-tab bottom nav** with bear icons. Always visible. ~64px tall + safe-area padding.
- Generous **24px gutters** (`px-6`) on content; 16–20px between cards.

### Transparency & blur
- `bg-white/95 + backdrop-blur-md` → the bottom nav.
- `bg-white/20 + backdrop-blur-md` → glassy floating pills over hero photos.
- `bg-black/75 → 0` gradient → photo legibility scrim only.
- **No glassmorphism on chrome surfaces.** The app body is opaque pink.

### Imagery vibe
- **Warm**, **bright**, **food-photographed-by-natural-light** Unsplash Korea shots.
- No black-and-white. No high-contrast street photography. No moody dusk shots.
- Cropped to **`object-cover`** in 28px-radius windows. Rated photos always have a faint bottom black gradient for the title overlay.

### Cards
- White fill (`bg-white` = #FFFFFF), 28–32px radius.
- 1px `--border-card` (#FED7DD).
- `--shadow-md` for stationary cards; `shadow-lg` for cards with photos.
- Inner padding: 16–20px (`p-4` to `p-5`).
- Internal dividers: dashed lines (Apple-Wallet ticket-stub style) on the flight card; otherwise no dividers — vertical rhythm is whitespace.

### Things to avoid
- ❌ Bluish-purple gradients (the lavender accent only appears as a pure swatch).
- ❌ Drop-shadow buttons with bottom-only offset (the Material 3 style).
- ❌ Cards with rounded corners and a colored left-border accent only.
- ❌ Inter / Roboto / system fonts — Nunito + Noto Sans TC is part of the brand.
- ❌ Hand-rolled SVG icons in production. Use lucide-react + the bear PNGs.

---

## Iconography

**Three icon systems coexist**, each with a strict role:

### 1. Bear PNG icons — for tabs and brand identity
6 PNGs in `assets/bear-icons/`:
- `home.png` (首頁) — bear with a tiny house hat
- `itinerary.png` (行程) — bear holding a clipboard
- `LIST.png` (待辦) — bear with a checklist note
- `MAP.png` (地圖) — bear with map pin
- `COST.png` (預算) — bear with ₩ coin
- `SETTING.png` (設定) — bear with gear crown

These are **always rendered with `mix-blend-mode: multiply`** so the brown bear picks up the active text color. The source has a graceful fallback to hand-rolled SVG if a PNG is missing — preserve that in production.

### 2. Lucide-react — for everything else functional
Stroke icons, 24×24 viewbox, used in: `Home, Plane, MapPin, Wallet, ChevronRight, ChevronDown, Plus, Trash2, Check, X, Edit2, BedDouble, Store, Compass, Download, Upload, LogOut, Calendar`.

Sizes used: **`w-3 h-3` (12px)** in dense pills, **`w-3.5 h-3.5` (14px)** in flight-card chrome, **`w-4 h-4` (16px)** for input affordances, **`w-10 h-10` (40px)** for empty-state illustrations.

Color is always `text-milk-tea-{shade}` — never raw hex.

### 3. Emoji — for content and vibe
Documented above in *Content Fundamentals*. Rule of thumb: lucide-react in chrome; emoji in copy; bear PNGs at the brand level.

### 4. Stickers — for empty states and celebrations
The 18 PNGs in `assets/stickers/` are **illustrations**, not icons. Use them as `200×200`+ hero illustrations on empty states and as Lottie-style celebration moments after actions (sync success → 「收到!」 bear).

---

## Font substitution flag

⚠️ **No substitution made** — all three families (Nunito, Noto Sans TC, DM Mono) are loaded from Google Fonts via `@import`, identical to the source. If you'd prefer locally-hosted .ttf files for offline use, ping me and I'll inline them.
