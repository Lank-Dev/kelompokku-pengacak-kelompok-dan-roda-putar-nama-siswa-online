# Design System: KocokNama (Wheel of Names ID)

## 1. Visual Theme & Atmosphere
A high-energy, high-contrast digital stage engineered for rapid lottery spins, classroom name pickers, and corporate giveaways. The aesthetic is clean, authentic, and utilitarian—inspired by classic broadcast game shows and industrial physical roulette wheels, completely rejecting generic AI slop, fake purple glows, and blurry translucent gradients.

- **Atmosphere:** Clean Studio Light & OLED Dark Cockpit
- **Density:** Balanced (5/10) with high data density in side panels
- **Variance:** Offset Asymmetric Stage (6/10) with left-hand wheel anchor and right-hand operational tabs
- **Motion:** Quintic Ease-Out physics (7/10) with mechanical flapper spring bounce and burst confetti celebration

---

## 2. Color Palette & Functional Roles

### Neutrals (Light / Dark Adaptive)
- **Canvas Base (Light):** `#EDF0F5` — Soft neutral gray floor preventing eye fatigue under intense screen lighting
- **Canvas Base (Dark):** `#020617` — Deep Slate-950 void optimizing contrast and OLED power efficiency
- **Surface Elevation (Light):** `#FFFFFF` — Pure white container and card background
- **Surface Elevation (Dark):** `#0F172A` — Slate-900 elevated stage surface
- **Primary Ink (Light):** `#020617` — Maximum contrast text (18.2:1 against white)
- **Primary Ink (Dark):** `#F8FAFC` — Crisp off-white text
- **Secondary Ink (Light):** `#475569` — Slate-600 for descriptions, secondary hints, and metadata
- **Secondary Ink (Dark):** `#94A3B8` — Slate-400 for secondary hints
- **Structural Border (Light):** `#CBD5E1` — Crisp 1.5px Slate-300 containment lines
- **Structural Border (Dark):** `#334155` — Crisp 1.5px Slate-700 containment lines

### Authentic 10-Hue Chromatic Wheel Spectrum (Zero Muddy Gradients)
The wheel slices use a clean, equidistant chromatic cycle matching true optical color wheels:
1. **Spectrum Red:** `#EA4335`
2. **Spectrum Amber-Orange:** `#FF6D00`
3. **Spectrum Golden Yellow:** `#FBBC05`
4. **Spectrum Lime:** `#8BC34A`
5. **Spectrum Emerald:** `#34A853`
6. **Spectrum Cyan:** `#00BCD4`
7. **Spectrum Royal Blue:** `#4285F4`
8. **Spectrum Indigo:** `#3F51B5`
9. **Spectrum Purple:** `#9C27B0`
10. **Spectrum Magenta Pink:** `#E91E63`

### Celebration & Winner Accents
- **Winner Gold Core:** `#F59E0B` (Amber-500) — Trophy accents, round badges, celebration pedestal
- **Winner Container Pedestal (Light):** `#FFFBEB` with `#FBBF24` 2px border and `#FEF3C7` ring
- **Winner Container Pedestal (Dark):** `#020617` with `#F59E0B` 2px border
- **Destructive / Remove Winner:** `#DC2626` (Red-600) — High-urgency action for discarding chosen names

---

## 3. Typography Architecture
- **Primary Display Font:** Geometric Neo-Grotesk (`Chivo`, `Plus Jakarta Sans`, or `Cabinet Grotesk`) with track-tight spacing (`-0.02em`) and weight-driven hierarchy.
- **Body Font:** High-legibility neutral sans with relaxed leading (`line-height: 1.5`).
- **Tabular Data & Operational Monospace:** `JetBrains Mono` or `Geist Mono` for round counters (`#1`, `#2`), timestamps (`HH:mm:ss`), entry tallies, and keyboard shortcut badges (`[SPASI]`).
- **Text Readability Guarantee:** All slice text on canvas rendered with WCAG 2.1 Dual-Pass contrast (`strokeText` outline + `fillText` foreground), preventing text from disappearing against any slice hue.

---

## 4. Component Stylings

### Wheel Stage (Left Panel)
- **Canvas Container:** Rounded-xs utilitarian containment card with crisp 1px borders (`border-slate-300` / `dark:border-slate-800`), flat high-contrast aesthetic, and zero blurry floating shadows.
- **Center Hub:** High-contrast mechanical turret button with 1.5px outer bezel, concentric calibration groove, active push feedback, and bold monospace `PUTAR` typography.
- **Right Indicator Pointer:** Precision calibrated needle gauge with fixed outer rim mounting bracket, 2-facet machined bevel body (illuminated upper facet `#ef4444`, shaded lower facet `#b91c1c`), center ridge line, crisp 1.2px perimeter border, and slotted brass pivot bolt.
- **Perimeter Rivets:** Crisp metallic studs with dark/light bounding rings for an authentic physical rotary instrument dial feel.

### Group Output Panel (Center Panel)
- **Structure:** Modular technical index cards with crisp 1px borders (`rounded-xs`), structured metadata header, active group ring highlight, and monospace slot allocations (`01`, `02`, ...).
- **Slot Status:** Clear telemetry states with `✓` confirmation for filled slots, pulsating `MENGUNDI...` for the active incoming slot, and `KOSONG` for waiting slots.
- **Legibility:** 100% high-contrast ink (`text-slate-950` light, `text-white` dark) ensuring full visibility on all screens.

### Participant Editor (Right Panel)
- **Structure:** Clean, focused monospace text editor container (`font-mono text-xs`) with technical status footer (`STATUS: SIAP / TERKUNCI`, `UTF-8`). No distracting ornaments or pill badges.

### Winner Celebration Modal
- **Backdrop Scrim:** Cinematic deep overlay (`bg-slate-950/80` with soft blur) creating stark isolation in both light and dark modes.
- **Card Surface:** Pure white card (`#FFFFFF`) with 2px crisp border.
- **Winner Pedestal:** Amber-tinted pedestal card (`#FFFBEB` with `#FBBF24` border) housing the winner name in 48px-60px ultra-bold black typography (`text-slate-950`).
- **Celebration Effects:** Multi-directional confetti cannons without sound delay.

---

## 5. Layout & Responsive Principles
- **Grid Architecture:** 12-column responsive layout (`lg:col-span-7 xl:col-span-8` for Wheel Stage, `lg:col-span-5 xl:col-span-4` for Sidebar).
- **Mobile First Collapse (< 1024px):** Single-column stacked workflow with wheel centered on top, followed by sidebar controls below.
- **Viewport Height:** Full-height layout bound to `min-h-[100dvh]` to eliminate mobile Safari address bar jumping.
- **Touch Target Discipline:** Minimum 44x44px touch targets on all interactive controls.
- **Zero Horizontal Scroll:** Strict overflow containment on all viewports.

---

## 6. Motion & Physics
- **Deceleration Curve:** Quintic Ease-Out ($1 - (1 - t)^5$) for dramatic slowing in the final 2 seconds.
- **Flapper Bounce:** Spring damping physics (`deflection *= 0.82`) on pointer arrow.
- **Snappiness:** Zero Web Audio API latencies; immediate start and clean ending.
- **Durasi Putaran:** Default 3.0 detik, user-configurable from 2s to 15s.

---

## 7. Anti-Patterns & Banned AI Slop
- **NO Generic AI Purple/Neon Glows:** Strictly banned.
- **NO Muddy Gradients:** No uncalibrated linear-gradient overlays on slices or headers.
- **NO Low-Contrast White-on-Light:** Every white-mode element must exceed WCAG AAA standards.
- **NO Faux Audio Buffering:** Zero audio blocking.
- **NO Em-Dashes in UI Copy:** Clean Indonesian typography without typographical fillers.
- **NO Placeholders:** Authentic Indonesian presets (15 murid, 50 karyawan, kupon 1-250) rather than generic "John Doe".
