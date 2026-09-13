import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { applyTheme, readStoredTheme } from "@/lib/theme.ts"

// React 挂载前先落地主题，避免启动瞬间闪一下另一套配色。
// 不能做成 index.html 里的内联脚本：生产构建的 CSP 是 script-src 'self'。
applyTheme(readStoredTheme())

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
)
