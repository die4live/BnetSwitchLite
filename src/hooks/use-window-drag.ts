import * as React from "react"
import { isTauri } from "@tauri-apps/api/core"
import { getCurrentWindow } from "@tauri-apps/api/window"

/**
 * 按下这些元素（或其内部）时不触发拖动，交互保持原样。
 * 原生 data-tauri-drag-region 只认直接命中的元素，且会吞掉点击，
 * 这里改成命中判定 + 位移阈值，两者兼顾。
 */
const INTERACTIVE_SELECTOR = [
  "button",
  "a[href]",
  "input",
  "textarea",
  "select",
  "option",
  "label",
  "[role='button']",
  "[role='link']",
  "[role='menuitem']",
  "[role='listbox']",
  "[role='slider']",
  "[data-no-drag]",
].join(",")

/** 位移小于该值仍算点击，避免按压抖动把点击变成拖动 */
const DRAG_THRESHOLD = 4

/**
 * 在空白/非交互区域按住左键并移动即可拖动窗口。
 * 返回需要挂到容器上的 ref。
 */
export function useWindowDrag<T extends HTMLElement>() {
  const ref = React.useRef<T | null>(null)

  React.useEffect(() => {
    const element = ref.current
    if (!element || !isTauri()) return

    let origin: { x: number; y: number } | null = null

    const reset = () => {
      origin = null
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || origin) return
      const target = event.target
      if (!(target instanceof Element)) return
      if (target.closest(INTERACTIVE_SELECTOR)) return
      // 非交互区域：吃掉默认行为，避免拖动过程中划出文字选区
      event.preventDefault()
      origin = { x: event.clientX, y: event.clientY }
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (!origin) return
      if (event.buttons === 0) {
        reset()
        return
      }
      const distance = Math.hypot(
        event.clientX - origin.x,
        event.clientY - origin.y
      )
      if (distance < DRAG_THRESHOLD) return
      reset()
      void getCurrentWindow().startDragging()
    }

    element.addEventListener("pointerdown", handlePointerDown, true)
    window.addEventListener("pointermove", handlePointerMove, true)
    window.addEventListener("pointerup", reset, true)
    window.addEventListener("pointercancel", reset, true)
    window.addEventListener("blur", reset)
    return () => {
      element.removeEventListener("pointerdown", handlePointerDown, true)
      window.removeEventListener("pointermove", handlePointerMove, true)
      window.removeEventListener("pointerup", reset, true)
      window.removeEventListener("pointercancel", reset, true)
      window.removeEventListener("blur", reset)
    }
  }, [])

  return ref
}
