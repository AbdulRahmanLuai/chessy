import { useEffect } from 'react';
import { getSocket, onSocketReady } from '@/socket/socket';
import { friendsService } from '@/services/friends.service';
import { useNotificationStore } from '@/store/notificationStore';
import { useFriendStore } from '@/store/friendStore';
import type {
  FriendRequestReceivedEvent,
  FriendRequestAcceptedEvent,
  FriendRequestCancelledEvent,
} from '@/socket/events';

/**
 * Keeps friendship socket state and notifications in sync independently of the
 * Friends popover, which is mounted only while open.
 */
export function useFriendSocketEvents(): void {
  const setNotification = useFriendStore((s) => s.setNotification);
  const bumpIncomingRequests = useFriendStore((s) => s.bumpIncomingRequests);
  const bumpOutgoingRequests = useFriendStore((s) => s.bumpOutgoingRequests);
  const bumpFriends = useFriendStore((s) => s.bumpFriends);
  const setIncomingRequestsCount = useFriendStore((s) => s.setIncomingRequestsCount);
  const incrementIncomingRequestsCount = useFriendStore((s) => s.incrementIncomingRequestsCount);
  const decrementIncomingRequestsCount = useFriendStore((s) => s.decrementIncomingRequestsCount);
  const pushToast = useNotificationStore((s) => s.push);

  // Seed the badge count once on mount, since socket events only capture
  // deltas from the moment the listener attaches.
  useEffect(() => {
    let cancelled = false;

    friendsService
      .getIncomingRequests({ page: 0, size: 1 })
      .then((res) => {
        if (!cancelled) setIncomingRequestsCount(res.total);
      })
      .catch(() => {
        // Non-fatal — badge just stays at 0 until the next socket event.
      });

    return () => {
      cancelled = true;
    };
  }, [setIncomingRequestsCount]);

  useEffect(() => {
    let cleanupListeners: (() => void) | null = null;

    const setupListeners = () => {
      const socket = getSocket();
      if (!socket) return;

      const onRequestReceived = (payload: FriendRequestReceivedEvent) => {
        setNotification({
          type: 'requestReceived',
          friendshipId: payload.friendshipId,
          fromUsername: payload.fromUsername,
        });
        bumpIncomingRequests();
        incrementIncomingRequestsCount();
        pushToast({
          kind: 'friendRequest',
          friendshipId: payload.friendshipId,
          fromUsername: payload.fromUsername,
        });
      };

      const onRequestAccepted = (payload: FriendRequestAcceptedEvent) => {
        setNotification({ type: 'requestAccepted', friendshipId: payload.friendshipId });
        bumpOutgoingRequests();
        bumpFriends();
      };

      // Fired on the SENDER's client when the RECIPIENT declines.
      const onRequestDeclined = () => {
        bumpOutgoingRequests();
      };

      // Fired on the RECIPIENT's client when the SENDER cancels their own
      // outgoing request — dedicated event from the new /cancel endpoint.
      const onRequestCancelled = (payload: FriendRequestCancelledEvent) => {
        void payload;
        bumpIncomingRequests();
        decrementIncomingRequestsCount();
      };

      const onFriendRemoved = () => {
        bumpFriends();
      };

      socket.on('friend:requestReceived', onRequestReceived);
      socket.on('friend:requestAccepted', onRequestAccepted);
      socket.on('friend:requestDeclined', onRequestDeclined);
      socket.on('friend:requestCancelled', onRequestCancelled);
      socket.on('friend:removed', onFriendRemoved);

      cleanupListeners = () => {
        socket.off('friend:requestReceived', onRequestReceived);
        socket.off('friend:requestAccepted', onRequestAccepted);
        socket.off('friend:requestDeclined', onRequestDeclined);
        socket.off('friend:requestCancelled', onRequestCancelled);
        socket.off('friend:removed', onFriendRemoved);
      };
    };

    const unsubscribeReady = onSocketReady(setupListeners);

    return () => {
      unsubscribeReady();
      cleanupListeners?.();
    };
  }, [
    setNotification,
    bumpIncomingRequests,
    bumpOutgoingRequests,
    bumpFriends,
    incrementIncomingRequestsCount,
    decrementIncomingRequestsCount,
    pushToast,
  ]);
}