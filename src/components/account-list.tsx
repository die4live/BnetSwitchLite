import { ExternalLink, FolderCog, RefreshCw, UserRound } from "lucide-react"

import { AccountRow } from "@/components/account-row"
import { OperationBar } from "@/components/operation-bar"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Separator } from "@/components/ui/separator"
import type {
  AccountKey,
  AccountSnapshot,
  LoginSessionSnapshot,
  OperationEvent,
} from "@/lib/types"
import { accountKeysEqual } from "@/lib/types"

interface AccountListProps {
  accounts: AccountSnapshot[]
  loginSession: LoginSessionSnapshot | null
  busy: boolean
  canCancelLogin: boolean
  currentAccountKey: AccountKey | null
  onRefresh: () => void
  onConfigurePath: () => void
  onOpenClient: () => void
  onSwitch: (account: AccountSnapshot) => void
  onRelogin: (account: AccountSnapshot) => void
  onDelete: (account: AccountSnapshot) => void
  onCancelLogin: () => void
  operation: OperationEvent | null
}

export function AccountList({
  accounts,
  loginSession,
  busy,
  canCancelLogin,
  currentAccountKey,
  onRefresh,
  onConfigurePath,
  onOpenClient,
  onSwitch,
  onRelogin,
  onDelete,
  onCancelLogin,
  operation,
}: AccountListProps) {
  return (
    <section
      aria-label="账号列表"
      className="flex min-h-0 min-w-0 flex-1 flex-col bg-card"
      data-window-content
    >
      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden bg-muted/20 p-2"
        data-account-rows
      >
        <div
          className="relative my-auto h-fit min-h-max w-full flex-none overflow-hidden rounded-lg border bg-card"
          data-account-rows-content
        >
          {accounts.length === 0 ? (
            <Empty className="min-h-16 p-2">
              <EmptyHeader className="max-w-none flex-row gap-2">
                <EmptyMedia className="mb-0 text-muted-foreground">
                  <UserRound className="size-[18px]" />
                </EmptyMedia>
                <EmptyTitle>未发现账号</EmptyTitle>
              </EmptyHeader>
              <ol className="w-full space-y-1 px-2 pb-1 text-left text-xs leading-5 text-muted-foreground">
                <li>1. 点底部「选择战网客户端」，定位到 Battle.net.exe</li>
                <li>2. 点「启动战网」，在登录界面登录你要保存的账号</li>
                <li>3. 回到本工具点「刷新账号」，登录状态即自动保存</li>
              </ol>
            </Empty>
          ) : (
            <div className="divide-y" role="list">
              {accounts.map((account) => {
                const loginPending =
                  loginSession !== null &&
                  accountKeysEqual(account.key, loginSession.intent.accountKey)

                return (
                  <div
                    data-account-row-item
                    key={`${account.key.environment}:${account.key.accountId}`}
                    role="listitem"
                  >
                    <AccountRow
                      account={account}
                      busy={busy || loginSession !== null}
                      cancelLoginDisabled={!canCancelLogin}
                      currentAccountKey={currentAccountKey}
                      loginPending={loginPending}
                      onCancelLogin={onCancelLogin}
                      onDelete={() => onDelete(account)}
                      onRelogin={() => onRelogin(account)}
                      onSwitch={() => onSwitch(account)}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <Separator data-account-separator />
      <div
        className="account-list-toolbar relative grid min-h-10 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 bg-muted/35 px-2"
        data-account-toolbar
      >
        <div className="col-start-1 flex items-center gap-0.5 justify-self-start">
          <Button
            disabled={busy || loginSession !== null}
            onClick={onOpenClient}
            size="sm"
            variant="quiet"
          >
            <ExternalLink data-icon="inline-start" />
            启动战网
          </Button>
          <Button
            disabled={busy || loginSession !== null}
            onClick={onRefresh}
            size="sm"
            variant="quiet"
          >
            <RefreshCw data-icon="inline-start" />
            刷新账号
          </Button>
        </div>

        <OperationBar operation={operation} />

        <div className="col-start-3 flex items-center gap-0.5 justify-self-end">
          <Button
            disabled={busy || loginSession !== null}
            onClick={onConfigurePath}
            size="sm"
            variant="quiet"
          >
            <FolderCog data-icon="inline-start" />
            选择战网客户端
          </Button>
        </div>
      </div>
    </section>
  )
}
