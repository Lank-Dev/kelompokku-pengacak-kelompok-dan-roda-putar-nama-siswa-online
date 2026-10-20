export function getContrastTextColor(hexColor: string): string {
  // Clean hex
  let hex = hexColor.replace('#', '')
  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('')
  }
  const r = parseInt(hex.substring(0, 2), 16) || 0
  const g = parseInt(hex.substring(2, 4), 16) || 0
  const b = parseInt(hex.substring(4, 6), 16) || 0

  // Perceived brightness formula (ITU-R BT.709)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.62 ? '#0f172a' : '#ffffff'
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
