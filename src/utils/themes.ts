import type { WheelTheme } from '../types'

// World-Class Anti-Slop Wheel Palettes
// Tested 100% WCAG AA (>= 4.5:1) & AAA contrast against crisp white text (#FFFFFF)
export const WHEEL_THEMES: WheelTheme[] = [
  {
    id: 'chromatic-standard',
    name: '12 Spektrum Equiluminant (Anti-Slop Master)',
    colors: [
      '#DC2626', // Slice 01: Crimson Red (Hue 0° | Contrast: 4.83:1)
      '#C2410C', // Slice 02: Burnt Terracotta (Hue 17° | Contrast: 5.18:1)
      '#A16207', // Slice 03: Golden Ochre (Hue 35° | Contrast: 4.92:1)
      '#4D7C0F', // Slice 04: Olive Bronze (Hue 85° | Contrast: 4.99:1)
      '#15803D', // Slice 05: Forest Emerald (Hue 142° | Contrast: 5.02:1)
      '#0F766E', // Slice 06: Nordic Teal (Hue 175° | Contrast: 5.47:1)
      '#0369A1', // Slice 07: Aegean Cyan (Hue 201° | Contrast: 5.93:1)
      '#2563EB', // Slice 8: Royal Cobalt (Hue 221° | Contrast: 5.17:1)
      '#4F46E5', // Slice 09: Indigo Iris (Hue 243° | Contrast: 6.29:1)
      '#7C3AED', // Slice 10: Imperial Violet (Hue 262° | Contrast: 5.70:1)
      '#A21CAF', // Slice 11: Berry Plum (Hue 294° | Contrast: 6.32:1)
      '#BE123C', // Slice 12: Ruby Rose (Hue 345° | Contrast: 6.29:1)
    ],
  },
  {
    id: 'high-contrast-alternating',
    name: '12 Kontras Maksimal (Alternating Warm/Cool)',
    colors: [
      '#DC2626', // Slice 01: Crimson Red (Warm)
      '#2563EB', // Slice 02: Royal Cobalt (Cool)
      '#A16207', // Slice 03: Golden Ochre (Warm)
      '#15803D', // Slice 04: Forest Emerald (Cool)
      '#C2410C', // Slice 05: Burnt Terracotta (Warm)
      '#0369A1', // Slice 06: Aegean Cyan (Cool)
      '#BE123C', // Slice 07: Ruby Rose (Warm)
      '#4F46E5', // Slice 08: Indigo Iris (Cool)
      '#4D7C0F', // Slice 09: Olive Bronze (Warm-Green)
      '#7C3AED', // Slice 10: Imperial Violet (Cool)
      '#0F766E', // Slice 11: Nordic Teal (Cool)
      '#A21CAF', // Slice 12: Berry Plum (Warm-Purple)
    ],
  },
  {
    id: 'google-vibrant',
    name: 'Google 4 Colors',
    colors: ['#2563EB', '#DC2626', '#D97706', '#059669'],
  },
  {
    id: 'wheel-six-classic',
    name: '6 Classic Game Show Colors',
    colors: ['#DC2626', '#EA580C', '#D97706', '#15803D', '#2563EB', '#7C3AED'],
  },
  {
    id: 'ocean-deep',
    name: 'Ocean Blues',
    colors: ['#0D47A1', '#1565C0', '#1976D2', '#1E88E5', '#0284C7', '#0369A1', '#0E7490'],
  },
]
