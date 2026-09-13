import { Monitor, Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTheme } from "@/hooks/use-theme"
import type { ThemeMode } from "@/lib/theme"

/** 图标表示「当前」模式，提示文案说明「点了之后」会切到哪一档 */
const NEXT_ACTION_LABELS: Record<ThemeMode, string> = {
  system: "切换到浅色主题",
  light: "切换到深色主题",
  dark: "切换到跟随系统主题",
}

function ModeIcon({ mode }: { mode: ThemeMode }) {
  if (mode === "light") return <Sun className="size-3.5" />
  if (mode === "dark") return <Moon className="size-3.5" />
  return <Monitor className="size-3.5" />
}

/**
 * 底部工具栏最右的明暗切换。始终只显示图标（工具栏宽度紧张），
 * 所以提示也一直挂着；点击按「跟随系统 → 浅色 → 深色」循环。
 */
export function ThemeToggleButton() {
  const { mode, cycle } = useTheme()
  const label = NEXT_ACTION_LABELS[mode]

  return (
    <Tooltip>
      <TooltipTrigger
        closeDelay={0}
        delay={60}
        render={
          <Button
            aria-label={label}
            onClick={cycle}
            size="icon-sm"
            variant="quiet"
          />
        }
      >
        <ModeIcon mode={mode} />
      </TooltipTrigger>
      <TooltipContent align="end" side="top">
        {label}
      </TooltipContent>
    </Tooltip>
  )
}
