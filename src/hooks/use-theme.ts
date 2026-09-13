import * as React from "react"

import type { ThemeMode } from "@/lib/theme"

export interface ThemeContextValue {
  /** 当前主题模式：跟随系统 / 浅色 / 深色 */
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  /** 按「跟随系统 → 浅色 → 深色」循环前进一格 */
  cycle: () => void
}

export const ThemeContext = React.createContext<ThemeContextValue | null>(null)

export function useTheme() {
  const value = React.useContext(ThemeContext)
  if (!value) {
    throw new Error("useTheme 必须在 ThemeProvider 内部使用")
  }
  return value
}
