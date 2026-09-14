'use client'

import { useEffect, useInsertionEffect } from 'react'

/**
 * Client-Side DOM Safety Guard
 *
 * Protects Next.js & React reconciliation against:
 * 1. `NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node`
 * 2. `NotFoundError: Failed to execute 'insertBefore' on 'Node'`
 *
 * This occurs particularly on mobile browsers (Android Chrome) when Google Translate,
 * autofill managers, or mobile keyboards inject/wrap DOM nodes (<font>, span, etc.)
 * outside of React's virtual DOM tree.
 */

function installDomGuard() {
  if (typeof window === 'undefined') return
  if ((window as any).__LUMO_CLIENT_DOM_GUARD_APPLIED__) return
  ;(window as any).__LUMO_CLIENT_DOM_GUARD_APPLIED__ = true

  try {
    // 1. Safe Node.prototype.removeChild
    const originalRemoveChild = Node.prototype.removeChild
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
      } catch (err: any) {
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
    Node.prototype.removeChild = safeRemoveChild

    if (typeof Element !== 'undefined' && Element.prototype.removeChild !== Node.prototype.removeChild) {
      Element.prototype.removeChild = safeRemoveChild as any
    }

    // 2. Safe Node.prototype.insertBefore
    const originalInsertBefore = Node.prototype.insertBefore
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
    Node.prototype.insertBefore = safeInsertBefore

    if (typeof Element !== 'undefined' && Element.prototype.insertBefore !== Node.prototype.insertBefore) {
      Element.prototype.insertBefore = safeInsertBefore as any
    }

    // 3. Global Unhandled Error Suppressor for mobile removeChild/insertBefore exceptions
    window.addEventListener(
      'error',
      (event) => {
        const msg = event?.message || ''
        if (
          msg.includes("Failed to execute 'removeChild' on 'Node'") ||
          msg.includes("Failed to execute 'insertBefore' on 'Node'") ||
          msg.includes('The node to be removed is not a child of this node')
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
        const reason = event?.reason
        const msg = typeof reason === 'string' ? reason : reason?.message || ''
        if (
          msg.includes("Failed to execute 'removeChild' on 'Node'") ||
          msg.includes("Failed to execute 'insertBefore' on 'Node'") ||
          msg.includes('The node to be removed is not a child of this node')
        ) {
          event.preventDefault()
          event.stopImmediatePropagation()
        }
      },
      true
    )
  } catch (err) {
    console.warn('[DOM Guard] Error initializing DOM protection', err)
  }
}

// Execute immediately when module loads on client
if (typeof window !== 'undefined') {
  installDomGuard()
}

export function ClientDomGuard() {
  useInsertionEffect(() => {
    installDomGuard()
  }, [])

  useEffect(() => {
    installDomGuard()
  }, [])

  return null
}
