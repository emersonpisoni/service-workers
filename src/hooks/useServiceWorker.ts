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
  // Verdadeiro quando há uma nova versão esperando para ativar
  needsUpdate: boolean
  // Força a atualização para a nova versão
  updateSW: () => void
  // Envia mensagem ao SW
  postMessage: (message: unknown) => void
  // Mensagens recebidas do SW
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
      console.log('[Hook] SW registrado:', registration)
      setState('registered')
    },
    onRegisterError(error) {
      console.error('[Hook] Erro ao registrar SW:', error)
      setState('error')
    },
    onNeedRefresh() {
      console.log('[Hook] Nova versão disponível!')
      setState('waiting')
    },
    onOfflineReady() {
      console.log('[Hook] App pronto para uso offline!')
    },
  })

  // Escuta mensagens vindas do Service Worker
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      setState('not-supported')
      return
    }

    const handleMessage = (event: MessageEvent) => {
      console.log('[Hook] Mensagem do SW:', event.data)
      setMessages((prev) => [...prev, event.data])
    }

    navigator.serviceWorker.addEventListener('message', handleMessage)
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage)
    }
  }, [])

  // Atualiza o estado baseado no SW ativo
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
