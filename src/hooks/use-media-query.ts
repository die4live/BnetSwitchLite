import * as React from "react"

/** 订阅 CSS 媒体查询，与样式表里的断点保持同一套判断 */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches
  )

  React.useEffect(() => {
    const media = window.matchMedia(query)
    const update = () => setMatches(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [query])

  return matches
}
