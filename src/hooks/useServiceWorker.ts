import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export type SWState =
  | 'not-supported'
  | 'checking'
  | 'registered'
  | 'installing'
  | 'waiting'
  | 'active'
  | 'error'

export interface SWInfo {
  state: SWState
  registration: ServiceWorkerRegistration | null
  // True when a new version is waiting to activate
  needsUpdate: boolean
  // Forces the update to the new version
  updateSW: () => void
  // Sends a message to the SW
  postMessage: (message: unknown) => void
  // Messages received from the SW
  messages: unknown[]
}

export function useServiceWorker(): SWInfo {
  const [state, setState] = useState<SWState>('checking')
  const [messages, setMessages] = useState<unknown[]>([])

  const {
    needRefresh: [needsUpdate],
    updateServiceWorker,
    offlineReady: [offlineReady],
  } = useRegisterSW({
    onRegistered(registration) {
      console.log('[Hook] SW registered:', registration)
      setState('registered')
    },
    onRegisterError(error) {
      console.error('[Hook] Error registering SW:', error)
      setState('error')
    },
    onNeedRefresh() {
      console.log('[Hook] New version available!')
      setState('waiting')
    },
    onOfflineReady() {
      console.log('[Hook] App ready for offline use!')
    },
  })

  // Listen for messages from the Service Worker
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      setState('not-supported')
      return
    }

    const handleMessage = (event: MessageEvent) => {
      console.log('[Hook] Message from SW:', event.data)
      setMessages((prev) => [...prev, event.data])
    }

    navigator.serviceWorker.addEventListener('message', handleMessage)
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage)
    }
  }, [])

  // Update state based on the active SW
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.ready.then((registration) => {
      if (registration.active) setState('active')
    })
  }, [offlineReady])

  const postMessage = (message: unknown) => {
    navigator.serviceWorker.controller?.postMessage(message)
  }

  return {
    state,
    registration: null,
    needsUpdate,
    updateSW: () => updateServiceWorker(true),
    postMessage,
    messages,
  }
}
