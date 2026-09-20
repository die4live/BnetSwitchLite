import { AVATAR_TONE_SURFACE, accountRegionTone } from "@/lib/format"
import { cn } from "@/lib/utils"

interface RegionBadgeProps {
  region: string
  className?: string
}

/**
 * 区服胶囊：底色走与头像同一张 tone 表，所以列表里「哪个服」和头像颜色永远对得上。
 * 高度固定 17px（11px 字 + 上下各 3px），放进 text-xs 的信息行里只会让行高多 1px，
 * 不影响账号行 64px 的最小高度。
 */
export function RegionBadge({ region, className }: RegionBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-1.5 py-[3px] text-[11px] leading-none font-medium",
        AVATAR_TONE_SURFACE[accountRegionTone(region)],
        className
      )}
    >
      {region}
    </span>
  )
}
