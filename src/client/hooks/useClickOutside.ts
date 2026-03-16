import { useEffect, type RefObject } from 'react'

/**
 * Calls `callback` when a mousedown event occurs outside the element
 * referenced by `ref`. The listener is only active when `active` is true
 * (defaults to true).
 */
export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  callback: () => void,
  active = true,
): void {
  useEffect(() => {
    if (!active) return

    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        callback()
      }
    }

    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [ref, callback, active])
}
