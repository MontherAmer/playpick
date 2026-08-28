import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

export interface IDisclosureMenu {
  isOpen: boolean
  toggle: () => void
  close: () => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
  panelRef: React.RefObject<HTMLDivElement | null>
}

/**
 * Open/close behaviour shared by every header menu.
 *
 * These are disclosures, not ARIA menus: the panels hold links, so Tab moves
 * through them and Enter follows them for free. There is deliberately no focus
 * trap (Tab must be able to leave) and no arrow-key roving — a menu role would
 * announce links as menu items and break Ctrl/Cmd-click.
 *
 * Focus returns to the trigger on Escape and *only* on Escape. After an outside
 * press or a Tab-out the user has deliberately moved focus somewhere else, and
 * pulling it back is the classic hand-rolled-menu bug.
 */
export function useDisclosureMenu(): IDisclosureMenu {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const { pathname } = useLocation()

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  const toggle = useCallback(() => {
    setIsOpen((open) => !open)
  }, [])

  // Close when navigating away, without stealing focus from the destination.
  // Adjusted during render rather than in an effect: an effect would render the
  // open panel once at the new route and then close it, one cascading render for
  // something that is knowable immediately.
  const [renderedPathname, setRenderedPathname] = useState(pathname)

  if (pathname !== renderedPathname) {
    setRenderedPathname(pathname)
    setIsOpen(false)
  }

  useEffect(() => {
    if (!isOpen) return

    const contains = (node: Node | null) =>
      node !== null && (panelRef.current?.contains(node) === true || triggerRef.current?.contains(node) === true)

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return

      setIsOpen(false)
      triggerRef.current?.focus()
    }

    // `pointerdown` rather than `click`, so a press that begins outside
    // dismisses before a stray activation lands.
    const handlePointerDown = (event: PointerEvent) => {
      if (!contains(event.target as Node | null)) setIsOpen(false)
    }

    const handleFocusIn = (event: FocusEvent) => {
      if (!contains(event.target as Node | null)) setIsOpen(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('focusin', handleFocusIn)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('focusin', handleFocusIn)
    }
  }, [isOpen])

  return { isOpen, toggle, close, triggerRef, panelRef }
}
