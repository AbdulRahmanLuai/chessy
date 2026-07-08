import { useEffect, useCallback } from 'react';
import { getSocket } from '@/socket/socket';
import { friendsService } from '@/services/friends.service';
import { useNotificationStore } from '@/store/notificationStore';
import {
  useFriendStore,
  useLatestFriendNotification,
  useFriendError,
  useIncomingRequestsVersion,
  useOutgoingRequestsVersion,
  useFriendsVersion,
} from '@/store/friendStore';
import type {
  FriendRequestReceivedEvent,
  FriendRequestAcceptedEvent,
  FriendRequestDeclinedEvent,
  FriendRemovedEvent,
} from '@/socket/events';

export function useFriends() {
  const latestNotification = useLatestFriendNotification();
  const error = useFriendError();
  const incomingRequestsVersion = useIncomingRequestsVersion();
  const outgoingRequestsVersion = useOutgoingRequestsVersion();
  const friendsVersion = useFriendsVersion();

  const setNotification = useFriendStore((s) => s.setNotification);
  const clearNotification = useFriendStore((s) => s.clearNotification);
  const bumpIncomingRequests = useFriendStore((s) => s.bumpIncomingRequests);
  const bumpOutgoingRequests = useFriendStore((s) => s.bumpOutgoingRequests);
  const bumpFriends = useFriendStore((s) => s.bumpFriends);
  const setError = useFriendStore((s) => s.setError);

  const pushToast = useNotificationStore((s) => s.push);

  // ─── Socket listeners — transient notification only ────────────────────────

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    
    const onRequestReceived = (payload: FriendRequestReceivedEvent) => {
      setNotification({
        type: 'requestReceived',
        friendshipId: payload.friendshipId,
        fromUsername: payload.fromUsername,
      });

      bumpIncomingRequests();

      pushToast({
        kind: 'friendRequest',
        friendshipId: payload.friendshipId,
        fromUsername: payload.fromUsername,
      });
    };

    const onRequestAccepted = (payload: FriendRequestAcceptedEvent) => {
      setNotification({
        type: 'requestAccepted',
        friendshipId: payload.friendshipId,
      });
      bumpOutgoingRequests();
      bumpFriends();
    };

    const onRequestDeclined = (payload: FriendRequestDeclinedEvent) => {
      bumpOutgoingRequests();
    };

    const onFriendRemoved = (payload: FriendRemovedEvent) => {
      bumpFriends();
    };

    socket.on('friend:requestReceived', onRequestReceived);
    socket.on('friend:requestAccepted', onRequestAccepted);
    socket.on('friend:requestDeclined', onRequestDeclined);
    socket.on('friend:removed', onFriendRemoved);

    return () => {
      socket.off('friend:requestReceived', onRequestReceived);
      socket.off('friend:requestAccepted', onRequestAccepted);
      socket.off('friend:requestDeclined', onRequestDeclined);
      socket.off('friend:removed', onFriendRemoved);
    };
  }, [setNotification, bumpIncomingRequests, bumpOutgoingRequests, bumpFriends]);

  // ─── Actions — call service directly, bump versions, no local list state ──

  const sendRequest = useCallback(async (targetUserId: string) => {
    try {
      await friendsService.sendRequest(targetUserId);
      bumpOutgoingRequests();
    } catch {
      setError('Failed to send friend request');
    }
  }, [bumpOutgoingRequests, setError]);

  const acceptRequest = useCallback(async (friendshipId: string) => {
    try {
      await friendsService.acceptRequest(friendshipId);
      bumpIncomingRequests();
      bumpFriends();
    } catch {
      setError('Failed to accept friend request');
    }
  }, [bumpIncomingRequests, bumpFriends, setError]);

  const declineRequest = useCallback(async (friendshipId: string) => {
    try {
      await friendsService.declineRequest(friendshipId);
      bumpIncomingRequests();
    } catch {
      setError('Failed to decline friend request');
    }
  }, [bumpIncomingRequests, setError]);

  const removeFriend = useCallback(async (friendshipId: string) => {
    try {
      await friendsService.removeFriend(friendshipId);
      bumpFriends();
    } catch {
      setError('Failed to remove friend');
    }
  }, [bumpFriends, setError]);

  return {
    latestNotification,
    clearNotification,
    error,
    incomingRequestsVersion,
    outgoingRequestsVersion,
    friendsVersion,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
  };
}