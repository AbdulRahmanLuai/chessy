import { useCallback } from 'react';
import { friendsService } from '@/services/friends.service';
import {
  useFriendStore,
  useLatestFriendNotification,
  useFriendError,
  useIncomingRequestsVersion,
  useOutgoingRequestsVersion,
  useFriendsVersion,
  useIncomingRequestsCount,
} from '@/store/friendStore';

export function useFriends() {
  const latestNotification = useLatestFriendNotification();
  const error = useFriendError();
  const incomingRequestsVersion = useIncomingRequestsVersion();
  const outgoingRequestsVersion = useOutgoingRequestsVersion();
  const friendsVersion = useFriendsVersion();
  const incomingRequestsCount = useIncomingRequestsCount();

  const clearNotification = useFriendStore((s) => s.clearNotification);
  const bumpIncomingRequests = useFriendStore((s) => s.bumpIncomingRequests);
  const bumpOutgoingRequests = useFriendStore((s) => s.bumpOutgoingRequests);
  const bumpFriends = useFriendStore((s) => s.bumpFriends);
  const decrementIncomingRequestsCount = useFriendStore((s) => s.decrementIncomingRequestsCount);
  const setError = useFriendStore((s) => s.setError);

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
      decrementIncomingRequestsCount();
    } catch {
      setError('Failed to accept friend request');
    }
  }, [bumpIncomingRequests, bumpFriends, decrementIncomingRequestsCount, setError]);

  const declineRequest = useCallback(async (friendshipId: string) => {
    try {
      await friendsService.declineRequest(friendshipId);
      bumpIncomingRequests();
      decrementIncomingRequestsCount();
    } catch {
      setError('Failed to decline friend request');
    }
  }, [bumpIncomingRequests, decrementIncomingRequestsCount, setError]);

  const cancelRequest = useCallback(async (friendshipId: string) => {
    try {
      await friendsService.cancelOutgoingRequest(friendshipId);
      bumpOutgoingRequests();
    } catch {
      setError('Failed to cancel friend request');
    }
  }, [bumpOutgoingRequests, setError]);

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
    incomingRequestsCount,
    sendRequest,
    acceptRequest,
    declineRequest,
    cancelRequest,
    removeFriend,
  };
}