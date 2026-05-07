import { useEffect, useMemo, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import { useSelector } from 'react-redux'
import type { RootState } from '../store'

function getSocketOrigin(): string {
  const raw = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').trim()
  return raw.replace(/\/api\/?$/i, '').replace(/\/$/, '') || 'http://localhost:5000'
}

export function useBoardsSocket(boardId: string | null) {
  const authToken = useSelector((s: RootState) => s.auth.token)
  const tenantId = useSelector((s: RootState) => (s.tenant?.tenantId as string | null) ?? null)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const lastJoinedRef = useRef<string | null>(null)

  const socketOrigin = useMemo(() => getSocketOrigin(), [])

  useEffect(() => {
    const token = authToken || localStorage.getItem('token')
    if (!token) return

    const s = io(`${socketOrigin}/boards`, {
      auth: { token, ...(tenantId ? { tenantId } : {}) },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 5000,
      autoConnect: true,
    })

    s.on('connect', () => setIsConnected(true))
    s.on('disconnect', () => setIsConnected(false))

    setSocket(s)
    return () => {
      s.removeAllListeners()
      s.disconnect()
      setSocket(null)
      setIsConnected(false)
      lastJoinedRef.current = null
    }
  }, [authToken, socketOrigin, tenantId])

  useEffect(() => {
    if (!socket || !isConnected) return
    if (!boardId) return
    if (lastJoinedRef.current === boardId) return

    socket.emit('board:join', { boardId }, (err: any) => {
      if (err) {
        // non-fatal: UI can fallback to REST
        return
      }
      lastJoinedRef.current = boardId
    })
  }, [socket, isConnected, boardId])

  return { socket, isConnected }
}

