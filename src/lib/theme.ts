export type ThemeMode = "system" | "light" | "dark"

export const THEME_MODES = [
  "system",
  "light",
  "dark",
] as const satisfies readonly ThemeMode[]

/** localStorage 键。`index.html` 之外没有第二处写入点，改名要同步 `readStoredTheme` */
export const THEME_STORAGE_KEY = "bnetswitchlite.theme"

export const COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)"

/** 点一次按钮前进一格：跟随系统 → 浅色 → 深色 → 跟随系统 */
export function nextThemeMode(mode: ThemeMode): ThemeMode {
  const index = THEME_MODES.indexOf(mode)
  return THEME_MODES[(index + 1) % THEME_MODES.length] ?? "system"
}

export function isThemeMode(value: unknown): value is ThemeMode {
  return (
    typeof value === "string" &&
    (THEME_MODES as readonly string[]).includes(value)
  )
}

/** 读取本地保存的主题偏好；没有记录或值不合法时回落到「跟随系统」 */
export function readStoredTheme(): ThemeMode {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    return isThemeMode(stored) ? stored : "system"
  } catch {
    // 存储不可用（隐私模式等）时仍要能渲染，按跟随系统处理
    return "system"
  }
}

export function writeStoredTheme(mode: ThemeMode) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode)
  } catch {
    // 写不进去不影响当次会话里的主题生效
  }
}

/** 把模式解析成实际生效的明暗；「跟随系统」时读系统偏好 */
export function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode !== "system") return mode
  return window.matchMedia(COLOR_SCHEME_QUERY).matches ? "dark" : "light"
}

/**
 * 落在 <html> 上：
 * - `dark` / `light` class 供 Tailwind 的 dark 变体使用；
 * - `color-scheme` 让原生控件（滚动条、输入框、右键菜单）跟着明暗走。
 */
export function applyTheme(mode: ThemeMode) {
  const resolved = resolveTheme(mode)
  const root = document.documentElement
  root.classList.toggle("dark", resolved === "dark")
  root.classList.toggle("light", resolved === "light")
  root.style.colorScheme = resolved
}
