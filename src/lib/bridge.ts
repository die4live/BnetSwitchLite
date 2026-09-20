import { Channel, invoke, isTauri } from "@tauri-apps/api/core"
import { listen, type UnlistenFn } from "@tauri-apps/api/event"

import type {
  AccountKey,
  AccountSnapshot,
  AppSnapshot,
  LoginIntent,
  LoginCompletionResult,
  LoginCancellationStatus,
  OperationEvent,
} from "@/lib/types"

type EventHandler = (event: OperationEvent) => void

/** 与 `src-tauri/src/lib.rs` 的 SECOND_INSTANCE_EVENT 必须一致 */
const SECOND_INSTANCE_EVENT = "second-instance"
/** 浏览器预览模式下模拟「第二次启动」的 DOM 事件名，仅用于本地检查提示文案 */
const PREVIEW_SECOND_INSTANCE_EVENT = "bnetswitchlite:second-instance"

type SecondInstanceHandler = (runningVersion: string) => void

function serializeLoginIntent(intent: LoginIntent): LoginIntent {
  return {
    kind: "reauthenticate",
    accountKey: {
      environment: intent.accountKey.environment,
      accountId: intent.accountKey.accountId,
    },
  }
}

function requireDesktop() {
  if (!isTauri()) {
    throw new Error("战网切号器只能在桌面应用中运行")
  }
}

async function call<T>(command: string, args: Record<string, unknown> = {}) {
  requireDesktop()
  return invoke<T>(command, args)
}

async function callWithEvents<T = AppSnapshot>(
  command: string,
  args: Record<string, unknown>,
  onEvent: EventHandler
) {
  requireDesktop()
  const channel = new Channel<OperationEvent>()
  channel.onmessage = onEvent
  return invoke<T>(command, { ...args, onEvent: channel })
}

const desktopBridge = {
  load: (onEvent: EventHandler) =>
    callWithEvents("get_app_snapshot", {}, onEvent),
  refresh: () => call<AppSnapshot>("refresh_accounts"),
  switchAccount: (accountKey: AccountKey, onEvent: EventHandler) =>
    callWithEvents("switch_account", { accountKey }, onEvent),
  beginLogin: (intent: LoginIntent, onEvent: EventHandler) =>
    callWithEvents(
      "begin_login",
      { intent: serializeLoginIntent(intent) },
      onEvent
    ),
  completeLogin: (sessionId: string, onEvent: EventHandler) =>
    callWithEvents<LoginCompletionResult>(
      "complete_login",
      { sessionId },
      onEvent
    ),
  requestLoginCancellation: (sessionId: string) =>
    call<LoginCancellationStatus>("request_login_cancellation", { sessionId }),
  cancelLogin: (sessionId: string, onEvent: EventHandler) =>
    callWithEvents("cancel_login", { sessionId }, onEvent),
  removeAccount: (accountKey: AccountKey) =>
    call<AppSnapshot>("remove_account", { accountKey }),
  setClientPath: (executablePath: string) =>
    call<AppSnapshot>("set_client_path", { executablePath }),
  openClient: () => call<AppSnapshot>("open_client"),
  /**
   * 用户在已运行时又启动了一次（第二次启动的新进程会被单实例插件直接结束）。
   * 参数是**正在运行的这个实例**的版本号——用户据此就能看出屏幕上是旧版本。
   */
  onSecondInstance: (handler: SecondInstanceHandler): Promise<UnlistenFn> => {
    requireDesktop()
    return listen<string>(SECOND_INSTANCE_EVENT, (event) =>
      handler(event.payload)
    )
  },
  pickClientExecutable: async (
    currentPath: string,
    platform: AppSnapshot["platform"]
  ) => {
    requireDesktop()
    const { open } = await import("@tauri-apps/plugin-dialog")
    const isMac = platform === "macos"
    return open({
      title: "战网切号器",
      defaultPath: currentPath || undefined,
      directory: false,
      multiple: false,
      canCreateDirectories: isMac ? false : undefined,
      filters: [
        {
          name: "Battle.net",
          extensions: [isMac ? "app" : "exe"],
        },
      ],
    })
  },
}

/**
 * 浏览器预览模式：`npm run dev` 后直接用浏览器打开，用假数据渲染完整界面，
 * 便于用 devtools 检查布局和元素（Tauri 运行时不会走到这里）。
 */
function previewSnapshot(): AppSnapshot {
  const now = Date.now()
  // region 用后端 region_label 的真实文案，头像配色按它取值
  const accounts: AccountSnapshot[] = [
    {
      key: { environment: "kr.actual.battle.net", accountId: "1001" },
      id: "acc-1001",
      battleTag: "亚服一号#3456",
      region: "亚服",
      environment: "kr.actual.battle.net",
      snapshotStatus: "ready",
      lastSavedAt: now - 3 * 60 * 60 * 1000,
      note: null,
    },
    {
      key: { environment: "cn.actual.battlenet.com.cn", accountId: "1002" },
      id: "acc-1002",
      battleTag: "国服玩家#7788",
      region: "国服",
      environment: "cn.actual.battlenet.com.cn",
      snapshotStatus: "ready",
      lastSavedAt: now - 26 * 60 * 60 * 1000,
      note: null,
    },
    {
      key: { environment: "us.actual.battle.net", accountId: "1003" },
      id: "acc-1003",
      battleTag: "ExpiredPlayer#9012",
      region: "美服",
      environment: "us.actual.battle.net",
      snapshotStatus: "expired",
      lastSavedAt: now - 40 * 24 * 60 * 60 * 1000,
      note: null,
    },
    {
      key: { environment: "eu.actual.battle.net", accountId: "1004" },
      id: "acc-1004",
      battleTag: "欧服猎人#2233",
      region: "欧服",
      environment: "eu.actual.battle.net",
      snapshotStatus: "missing",
      lastSavedAt: null,
      note: null,
    },
    {
      key: { environment: "global", accountId: "1005" },
      id: "acc-1005",
      battleTag: "GlobalPlayer#5566",
      region: "国际服",
      environment: "global",
      snapshotStatus: "ready",
      lastSavedAt: now - 30 * 60 * 1000,
      note: null,
    },
    {
      key: { environment: "unknown.example", accountId: "1006" },
      id: "acc-1006",
      battleTag: "未知区服#0000",
      region: "未知区服",
      environment: "unknown.example",
      snapshotStatus: "ready",
      lastSavedAt: now - 5 * 24 * 60 * 60 * 1000,
      note: null,
    },
  ]

  return {
    appName: "BnetSwitchLite",
    version: "1.0.4",
    mode: "desktop",
    platform: "windows",
    dataDirectory: "C:\\Tools\\BnetSwitchLite\\BnetSwitchLiteData",
    client: {
      status: "running",
      executablePath: "C:\\Program Files (x86)\\Battle.net\\Battle.net.exe",
      detectedAutomatically: true,
    },
    accounts,
    currentAccountKey: {
      environment: "cn.actual.battlenet.com.cn",
      accountId: "1002",
    },
    loginSession: null,
    notice: null,
    updatedAt: now,
  }
}

const browserPreviewBridge: typeof desktopBridge = {
  load: (onEvent) => {
    onEvent({
      kind: "recovery",
      phase: "starting",
      title: "正在检查本地状态",
      detail: "预览模式：假数据",
      progress: 100,
    })
    return Promise.resolve(previewSnapshot())
  },
  refresh: () => Promise.resolve(previewSnapshot()),
  switchAccount: (_accountKey, onEvent) => {
    onEvent({
      kind: "switch",
      phase: "restoring",
      title: "正在切换",
      detail: "预览模式：不会真的切换",
      progress: 100,
    })
    return Promise.resolve(previewSnapshot())
  },
  beginLogin: () => Promise.resolve(previewSnapshot()),
  completeLogin: () =>
    Promise.resolve({ snapshot: previewSnapshot(), cancelled: false }),
  requestLoginCancellation: () =>
    Promise.resolve<LoginCancellationStatus>("accepted"),
  cancelLogin: () => Promise.resolve(previewSnapshot()),
  removeAccount: () => Promise.resolve(previewSnapshot()),
  setClientPath: () => Promise.resolve(previewSnapshot()),
  openClient: () => Promise.resolve(previewSnapshot()),
  // 预览模式没有 Tauri 事件总线，用 window 事件顶替，方便在浏览器里看提示文案/排版：
  //   window.dispatchEvent(new CustomEvent("bnetswitchlite:second-instance", { detail: "1.0.3" }))
  onSecondInstance: (handler) => {
    const onPreviewEvent = (event: Event) =>
      handler(String((event as CustomEvent<string>).detail ?? ""))
    window.addEventListener(PREVIEW_SECOND_INSTANCE_EVENT, onPreviewEvent)
    return Promise.resolve(() =>
      window.removeEventListener(PREVIEW_SECOND_INSTANCE_EVENT, onPreviewEvent)
    )
  },
  pickClientExecutable: () => Promise.resolve(null),
}

export const appBridge = isTauri() ? desktopBridge : browserPreviewBridge
