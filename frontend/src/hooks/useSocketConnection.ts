import { useEffect } from 'react';
import { useAccessToken } from '@/store/authStore';
import { connectSocket, disconnectSocket } from '@/socket/socket';

export function useSocketConnection() {
  const accessToken = useAccessToken();

  useEffect(() => {
    if (accessToken) {
      connectSocket(accessToken);
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [accessToken]);
}