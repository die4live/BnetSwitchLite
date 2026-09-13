"use client"

import * as React from "react"
import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog"

import { Button } from "@/components/ui/button"

export interface ConfirmOptions {
  /** 确认按钮文案，默认「继续」 */
  okLabel?: string
  /** 危险操作（移除账号等不可逆动作）：确认按钮用警示样式，初始焦点给「取消」 */
  danger?: boolean
}

export type ConfirmFn = (
  message: string,
  options?: ConfirmOptions
) => Promise<boolean>

interface ConfirmRequest {
  message: string
  okLabel: string
  danger: boolean
  resolve: (confirmed: boolean) => void
}

const ConfirmContext = React.createContext<ConfirmFn | null>(null)

export function useConfirm() {
  const confirm = React.useContext(ConfirmContext)
  if (!confirm) {
    throw new Error("useConfirm 必须在 ConfirmProvider 内部使用")
  }
  return confirm
}

/**
 * 应用内确认弹窗。原生系统对话框永远居中于屏幕、无法跟随窗口，窄窗口下会跑到窗口外，
 * 所以这里自己实现：`fixed` 相对 webview 视口（即窗口内容区）定位，所以天然居中于窗口。
 *
 * 层级取 1000000000：sonner 的通知条是 999999999，弹窗必须盖在通知之上。
 */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = React.useState<ConfirmRequest | null>(null)
  const requestRef = React.useRef<ConfirmRequest | null>(null)
  const cancelButtonRef = React.useRef<HTMLButtonElement>(null)
  const confirmButtonRef = React.useRef<HTMLButtonElement>(null)

  const settle = React.useCallback((confirmed: boolean) => {
    const current = requestRef.current
    if (!current) return
    requestRef.current = null
    setRequest(null)
    current.resolve(confirmed)
  }, [])

  const confirm = React.useCallback<ConfirmFn>((message, options) => {
    return new Promise<boolean>((resolve) => {
      // 同一时刻只保留一个待决请求；上一个按取消结束，避免调用方永久挂起
      requestRef.current?.resolve(false)
      const next: ConfirmRequest = {
        message,
        okLabel: options?.okLabel ?? "继续",
        danger: options?.danger ?? false,
        resolve,
      }
      requestRef.current = next
      setRequest(next)
    })
  }, [])

  React.useEffect(
    () => () => {
      requestRef.current?.resolve(false)
      requestRef.current = null
    },
    []
  )

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialogPrimitive.Root
        open={request !== null}
        onOpenChange={(open) => {
          // Esc 或组件主动收起，一律按「取消」结算
          if (!open) settle(false)
        }}
      >
        <AlertDialogPrimitive.Portal>
          <AlertDialogPrimitive.Backdrop
            data-slot="confirm-backdrop"
            className="fixed inset-0 z-[1000000000] bg-black/40 duration-100 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
          />
          <AlertDialogPrimitive.Popup
            data-slot="confirm-popup"
            initialFocus={request?.danger ? cancelButtonRef : confirmButtonRef}
            className="fixed top-1/2 left-1/2 z-[1000000000] max-h-[calc(100vh-0.5rem)] w-[min(20rem,calc(100vw-1rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-popover p-3 text-popover-foreground shadow-lg duration-100 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
          >
            <AlertDialogPrimitive.Title className="sr-only">
              确认操作
            </AlertDialogPrimitive.Title>
            <AlertDialogPrimitive.Description
              data-slot="confirm-message"
              className="text-xs leading-snug text-pretty"
            >
              {request?.message}
            </AlertDialogPrimitive.Description>
            <div className="mt-3 flex items-center justify-end gap-2">
              <Button
                onClick={() => settle(false)}
                ref={cancelButtonRef}
                size="sm"
                variant="secondary"
              >
                取消
              </Button>
              <Button
                onClick={() => settle(true)}
                ref={confirmButtonRef}
                size="sm"
                variant={request?.danger ? "destructive" : "default"}
              >
                {request?.okLabel ?? "继续"}
              </Button>
            </div>
          </AlertDialogPrimitive.Popup>
        </AlertDialogPrimitive.Portal>
      </AlertDialogPrimitive.Root>
    </ConfirmContext.Provider>
  )
}
