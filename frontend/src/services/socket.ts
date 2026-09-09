import { io, Socket } from 'socket.io-client'

let socketInstance: Socket | null = null

export function getSocket(): Socket {
  if (!socketInstance) {
    const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'
    const socketUrl = rawUrl.replace(/\/api\/v1\/?$/, '')
    socketInstance = io(socketUrl, {
      transports: ['polling', 'websocket'],
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 10000,
    })
  }
  return socketInstance
}

export function joinUserRoom(userId: string) {
  const socket = getSocket()
  if (socket.connected) {
    socket.emit('user:join', userId)
  } else {
    socket.once('connect', () => {
      socket.emit('user:join', userId)
    })
  }
}
