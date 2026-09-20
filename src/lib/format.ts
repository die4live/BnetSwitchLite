export function formatRelativeTime(timestamp: number | null) {
  if (timestamp === null) return "尚未保存"

  const elapsed = Math.max(0, Date.now() - timestamp)
  const minutes = Math.floor(elapsed / 60_000)

  if (minutes < 1) return "刚刚"
  if (minutes < 60) return `${minutes} 分钟前`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`

  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} 天前`

  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
  }).format(timestamp)
}

export function accountInitials(battleTag: string) {
  const characters = Array.from(battleTag.split("#")[0].trim())
  const length = characters.some((character) =>
    /\p{Script=Han}/u.test(character)
  )
    ? 1
    : 2
  return characters.slice(0, length).join("").toUpperCase()
}

export type AccountAvatarTone =
  "default" | "red" | "amber" | "mint" | "cyan" | "blue" | "violet" | "rose"

/**
 * 头像底色按区服固定（与后端 region_label 的枚举一一对应），
 * 没命中的区服（含「未知区服」）回落到灰色 default。
 */
const REGION_TONES: Record<string, AccountAvatarTone> = {
  国服: "red",
  台服: "rose",
  亚服: "amber",
  东南亚服: "mint",
  国际服: "cyan",
  美服: "blue",
  欧服: "violet",
}

export function accountRegionTone(region: string): AccountAvatarTone {
  return REGION_TONES[region.trim()] ?? "default"
}

/**
 * tone → 底色 / 前景色组合（深浅两套由 index.css 的 --avatar-* 变量切换）。
 *
 * 头像与区服胶囊共用这一张表，新增 tone 只改这里，两处不会漂移。
 * 注意：Tailwind 靠扫描源码里的**字面量**生成工具类，所以类名必须写全，
 * 不能写成 `bg-avatar-${tone}` 这种拼接形式。
 */
export const AVATAR_TONE_SURFACE: Record<AccountAvatarTone, string> = {
  default: "bg-muted text-muted-foreground",
  red: "bg-avatar-red text-avatar-red-foreground",
  amber: "bg-avatar-amber text-avatar-amber-foreground",
  mint: "bg-avatar-mint text-avatar-mint-foreground",
  cyan: "bg-avatar-cyan text-avatar-cyan-foreground",
  blue: "bg-avatar-blue text-avatar-blue-foreground",
  violet: "bg-avatar-violet text-avatar-violet-foreground",
  rose: "bg-avatar-rose text-avatar-rose-foreground",
}
