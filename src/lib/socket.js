'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(undefined);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(undefined);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const socketInstance = io({
      path: '/socket.io/',
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [mounted]);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}