// WCAG 2.1 Contrast & Readability Engine

function sRGBtoLin(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

export function getRelativeLuminance(hexColor: string): number {
  let hex = hexColor.replace('#', '')
  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('')
  }
  const r = parseInt(hex.substring(0, 2), 16) || 0
  const g = parseInt(hex.substring(2, 4), 16) || 0
  const b = parseInt(hex.substring(4, 6), 16) || 0

  const rLin = sRGBtoLin(r / 255)
  const gLin = sRGBtoLin(g / 255)
  const bLin = sRGBtoLin(b / 255)

  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin
}

export function getContrastRatio(lum1: number, lum2: number): number {
  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)
  return (lighter + 0.05) / (darker + 0.05)
}

export interface ContrastTextConfig {
  textColor: string
  strokeColor: string
  hasHighContrast: boolean
}

export function getSliceTextStyles(hexColor: string): ContrastTextConfig {
  const bgLum = getRelativeLuminance(hexColor)
  const whiteLum = 1.0
  const darkLum = getRelativeLuminance('#0f172a') // deep charcoal ~0.01

  const contrastWhite = getContrastRatio(bgLum, whiteLum)
  const contrastDark = getContrastRatio(bgLum, darkLum)

  // Pick the foreground that gives the higher WCAG contrast ratio
  if (contrastDark > contrastWhite) {
    return {
      textColor: '#0f172a', // Deep charcoal black
      strokeColor: 'rgba(255, 255, 255, 0.85)', // Crisp white outline
      hasHighContrast: contrastDark >= 4.5,
    }
  } else {
    return {
      textColor: '#ffffff', // Crisp white
      strokeColor: 'rgba(15, 23, 42, 0.85)', // Deep black outline
      hasHighContrast: contrastWhite >= 4.5,
    }
  }
}

export function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) {
    return text
  }
  let str = text
  while (str.length > 3 && ctx.measureText(str + '…').width > maxWidth) {
    str = str.slice(0, -1)
  }
  return str + '…'
}
