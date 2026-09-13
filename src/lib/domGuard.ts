/**
 * DOM Node Safety Guard
 *
 * Protects Next.js & React reconciliation against `NotFoundError: Failed to execute 'removeChild' on 'Node'`
 * and `NotFoundError: Failed to execute 'insertBefore' on 'Node'`.
 *
 * These runtime errors occur when browser extensions (e.g. Google Translate, Grammarly, Dark Reader, LastPass)
 * or media controllers alter, wrap, or reparent React-managed DOM nodes.
 */

if (typeof window !== 'undefined') {
  if (!(window as any).__LUMO_DOM_GUARD_INITIALIZED__) {
    ;(window as any).__LUMO_DOM_GUARD_INITIALIZED__ = true

    // 1. Safe removeChild wrapper
    const safeRemoveChild = function <T extends Node>(this: Node, child: T): T {
      if (!child) return child
      if (child.parentNode !== this) {
        if (child.parentNode) {
          try {
            return child.parentNode.removeChild(child) as T
          } catch {
            return child
          }
        }
        return child
      }
      try {
        return originalRemoveChild.call(this, child) as T
      } catch {
        if (child.parentNode && child.parentNode !== this) {
          try {
            return child.parentNode.removeChild(child) as T
          } catch {
            return child
          }
        }
        return child
      }
    }

    const originalRemoveChild = Node.prototype.removeChild
    Node.prototype.removeChild = safeRemoveChild

    if (typeof Element !== 'undefined' && Element.prototype.removeChild !== Node.prototype.removeChild) {
      Element.prototype.removeChild = safeRemoveChild as any
    }

    // 2. Safe insertBefore wrapper
    const safeInsertBefore = function <T extends Node>(this: Node, newNode: T, referenceNode: Node | null): T {
      if (referenceNode && referenceNode.parentNode !== this) {
        if (referenceNode.parentNode) {
          try {
            return referenceNode.parentNode.insertBefore(newNode, referenceNode) as T
          } catch {
            return originalInsertBefore.call(this, newNode, null) as T
          }
        }
        return originalInsertBefore.call(this, newNode, null) as T
      }
      try {
        return originalInsertBefore.call(this, newNode, referenceNode) as T
      } catch {
        return originalInsertBefore.call(this, newNode, null) as T
      }
    }

    const originalInsertBefore = Node.prototype.insertBefore
    Node.prototype.insertBefore = safeInsertBefore

    if (typeof Element !== 'undefined' && Element.prototype.insertBefore !== Node.prototype.insertBefore) {
      Element.prototype.insertBefore = safeInsertBefore as any
    }

    // 3. Global Unhandled Error Suppressor for Extension-Induced removeChild Errors
    window.addEventListener(
      'error',
      (event) => {
        if (
          event.message &&
          (event.message.includes("Failed to execute 'removeChild' on 'Node'") ||
            event.message.includes("Failed to execute 'insertBefore' on 'Node'") ||
            event.message.includes('The node to be removed is not a child of this node'))
        ) {
          event.preventDefault()
          event.stopImmediatePropagation()
        }
      },
      true
    )

    window.addEventListener(
      'unhandledrejection',
      (event) => {
        const reason = event.reason
        const message = typeof reason === 'string' ? reason : reason?.message
        if (
          message &&
          (message.includes("Failed to execute 'removeChild' on 'Node'") ||
            message.includes("Failed to execute 'insertBefore' on 'Node'") ||
            message.includes('The node to be removed is not a child of this node'))
        ) {
          event.preventDefault()
          event.stopImmediatePropagation()
        }
      },
      true
    )
  }
}

export {}
