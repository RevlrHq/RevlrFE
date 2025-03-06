'use client'

import { useSignalRStore } from '@lib/signalR'
import { useEffect } from 'react'

export function SignalRProvider({ children }: { children: React.ReactNode }) {
  const connect = useSignalRStore((state) => state.connect)
  const disconnect = useSignalRStore((state) => state.disconnect)

  useEffect(() => {
    connect()
    return () => { disconnect() }
  }, [connect, disconnect])

  return <>{children}</>
}