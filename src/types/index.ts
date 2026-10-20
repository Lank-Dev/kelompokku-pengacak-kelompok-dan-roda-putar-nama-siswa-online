export interface SliceItem {
  id: string
  text: string
  color: string
}

export interface WheelTheme {
  id: string
  name: string
  colors: string[]
}

export interface WinnerRecord {
  id: string
  name: string
  timestamp: string
  round: number
}

export interface WheelSettings {
  spinDuration: number // seconds (default 6)
  soundEnabled: boolean
  confettiEnabled: boolean
  winningMessage: string
  themeId: string
  allowDuplicates: boolean
  showRemoveButton: boolean
  darkMode: boolean
}
