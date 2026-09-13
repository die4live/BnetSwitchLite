import * as React from "react"
import { isTauri } from "@tauri-apps/api/core"
import { getCurrentWindow } from "@tauri-apps/api/window"

import { ThemeContext } from "@/hooks/use-theme"
import {
  applyTheme,
  COLOR_SCHEME_QUERY,
  nextThemeMode,
  readStoredTheme,
  resolveTheme,
  writeStoredTheme,
  type ThemeMode,
} from "@/lib/theme"

/**
 * 让原生窗口（Windows 上的标题栏）跟随应用主题，
 * 否则选了深色而系统是浅色时，标题栏会一直是亮色。
 */
async function syncWindowTheme(theme: "light" | "dark") {
  if (!isTauri()) return
  try {
    await getCurrentWindow().setTheme(theme)
  } catch (error: unknown) {
    console.error("无法同步窗口主题", error)
  }
}

/**
 * 主题偏好存在本机（localStorage），默认「跟随系统」。
 * 只有停留在「跟随系统」时才订阅系统明暗变化，用户一旦手动选定就不再被系统覆盖。
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = React.useState<ThemeMode>(readStoredTheme)

  React.useEffect(() => {
    applyTheme(mode)
    writeStoredTheme(mode)
    void syncWindowTheme(resolveTheme(mode))

    if (mode !== "system") return
    const mediaQuery = window.matchMedia(COLOR_SCHEME_QUERY)
    const handleChange = () => applyTheme(mode)
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [mode])

  const value = React.useMemo(
    () => ({
      mode,
      setMode,
      cycle: () => setMode((current) => nextThemeMode(current)),
    }),
    [mode]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
