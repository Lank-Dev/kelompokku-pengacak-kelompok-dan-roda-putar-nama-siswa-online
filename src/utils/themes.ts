import type { WheelTheme } from '../types'

// Curated Anti-Slop Chromatic Palette (WCAG AA compliant with dual-pass outline)
export const WHEEL_THEMES: WheelTheme[] = [
  {
    id: 'chromatic-standard',
    name: 'Chromatic Spectrum (Standard)',
    colors: [
      '#EA4335', // Red
      '#FF6D00', // Orange
      '#FBBC05', // Amber / Gold
      '#8BC34A', // Lime
      '#34A853', // Emerald
      '#00BCD4', // Cyan
      '#4285F4', // Blue
      '#3F51B5', // Indigo
      '#9C27B0', // Purple
      '#E91E63', // Magenta
      '#009688', // Teal
      '#795548', // Warm Slate
    ],
  },
  {
    id: 'google-vibrant',
    name: 'Google 4 Colors',
    colors: ['#4285F4', '#EA4335', '#FBBC05', '#34A853'],
  },
  {
    id: 'wheel-six-classic',
    name: '6 Classic Game Show Colors',
    colors: ['#E53935', '#FB8C00', '#FDD835', '#43A047', '#1E88E5', '#8E24AA'],
  },
  {
    id: 'ocean-deep',
    name: 'Ocean Blues',
    colors: ['#0D47A1', '#1565C0', '#1976D2', '#1E88E5', '#2196F3', '#03A9F4', '#00BCD4'],
  },
]
