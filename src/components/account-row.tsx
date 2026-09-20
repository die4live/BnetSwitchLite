import * as React from "react"
import { Trash2, X } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { RegionBadge } from "@/components/region-badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  accountInitials,
  accountRegionTone,
  formatRelativeTime,
} from "@/lib/format"
import { COMPACT_ACCOUNT_QUERY } from "@/lib/breakpoints"
import { useMediaQuery } from "@/hooks/use-media-query"
import type { AccountKey, AccountSnapshot } from "@/lib/types"
import { accountKeysEqual } from "@/lib/types"
import { cn } from "@/lib/utils"

interface AccountRowProps {
  account: AccountSnapshot
  busy: boolean
  cancelLoginDisabled: boolean
  currentAccountKey: AccountKey | null
  loginPending: boolean
  onCancelLogin: () => void
  onSwitch: () => void
  onRelogin: () => void
  onDelete: () => void
}

export function AccountRow({
  account,
  busy,
  cancelLoginDisabled,
  currentAccountKey,
  loginPending,
  onCancelLogin,
  onSwitch,
  onRelogin,
  onDelete,
}: AccountRowProps) {
  // 战网当前登录的就是这个账号时，它不再是切换目标
  const isCurrentAccount = accountKeysEqual(account.key, currentAccountKey)
  const actionLabel =
    account.snapshotStatus === "expired" ? "重新登录" : "登录并保存"
  const snapshotDetail =
    account.snapshotStatus === "ready"
      ? `${formatRelativeTime(account.lastSavedAt)}更新`
      : account.snapshotStatus === "expired"
        ? "登录已失效"
        : "尚未保存"

  // 窄窗口（≤360px）账号信息会被 CSS 隐藏，此时头像上给出快速提示。
  // 离开窄窗口时 Tooltip 触发器卸载，Base UI 会自己收掉并回调 onOpenChange，
  // 这里不需要额外的副作用清理。
  const compact = useMediaQuery(COMPACT_ACCOUNT_QUERY)
  const [tipOpen, setTipOpen] = React.useState(false)

  const avatar = (
    <Avatar size="lg">
      <AvatarFallback tone={accountRegionTone(account.region)}>
        {accountInitials(account.battleTag)}
      </AvatarFallback>
    </Avatar>
  )

  return (
    <article
      aria-busy={loginPending || undefined}
      className={cn(
        "account-row relative grid min-h-16 items-center gap-3 px-3 py-2.5 transition-colors duration-150 hover:bg-accent/45",
        loginPending && "bg-muted/30 hover:bg-muted/30"
      )}
    >
      {compact ? (
        <Tooltip open={tipOpen} onOpenChange={setTipOpen}>
          <TooltipTrigger
            closeDelay={0}
            closeOnClick={false}
            delay={60}
            render={
              <span
                className="cursor-default"
                data-no-drag=""
                onClick={() => setTipOpen((open) => !open)}
              />
            }
          >
            {avatar}
          </TooltipTrigger>
          <TooltipContent className="flex-col items-start gap-1" side="right">
            <span className="font-semibold">{account.battleTag}</span>
            <span className="flex items-center gap-1.5">
              <RegionBadge region={account.region} />
              <span className="opacity-80">{snapshotDetail}</span>
            </span>
          </TooltipContent>
        </Tooltip>
      ) : (
        avatar
      )}

      {/* 账号名区域保留文字选择，不参与窗口拖动 */}
      <div className="account-row-name min-w-0" data-no-drag="">
        <h2 className="truncate text-sm leading-5 font-semibold">
          {account.battleTag}
        </h2>
        {/* 胶囊自带背景边界，不要再加「·」分隔符（2026-09-13 用户要求去掉） */}
        <p className="mt-0.5 flex min-w-0 items-center gap-1.5 truncate text-xs text-muted-foreground">
          <RegionBadge region={account.region} />
          <span
            className={cn(
              "truncate",
              account.snapshotStatus === "expired" && "text-destructive",
              account.snapshotStatus === "missing" && "text-warning"
            )}
          >
            {snapshotDetail}
          </span>
        </p>
      </div>

      {loginPending ? (
        <div className="account-row-action flex shrink-0 items-center justify-end">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  aria-label="取消登录并恢复"
                  disabled={cancelLoginDisabled}
                  onClick={onCancelLogin}
                  size="icon-sm"
                  variant="quiet"
                />
              }
            >
              <X />
            </TooltipTrigger>
            <TooltipContent>取消登录并恢复</TooltipContent>
          </Tooltip>
        </div>
      ) : (
        <div className="account-row-action grid shrink-0 grid-cols-[5.75rem_1.75rem] items-center gap-1">
          {account.snapshotStatus === "ready" ? (
            <Button
              className="w-full"
              disabled={busy || isCurrentAccount}
              onClick={onSwitch}
              size="sm"
              variant={isCurrentAccount ? "surface-outline" : "default"}
            >
              {isCurrentAccount ? "已登录" : "切换"}
            </Button>
          ) : (
            <Button
              className="w-full"
              disabled={busy}
              onClick={onRelogin}
              size="sm"
              variant="surface-outline"
            >
              {actionLabel}
            </Button>
          )}

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  aria-label={`移除 ${account.battleTag}`}
                  className="account-row-delete"
                  disabled={busy}
                  onClick={onDelete}
                  size="icon-sm"
                  variant="quiet-destructive"
                />
              }
            >
              <Trash2 />
            </TooltipTrigger>
            <TooltipContent>移除账号</TooltipContent>
          </Tooltip>
        </div>
      )}
    </article>
  )
}
