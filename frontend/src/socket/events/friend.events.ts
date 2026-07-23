export interface FriendRequestReceivedEvent {
  friendshipId: string;
  fromUserId: string;
  fromUsername: string;
}

export interface FriendRequestAcceptedEvent {
  friendshipId: string;
  byUserId: string;
}

export interface FriendRequestDeclinedEvent {
  friendshipId: string;
}

export interface FriendRemovedEvent {
  friendshipId: string;
}
export interface FriendRequestCancelledEvent {
  friendshipId: string;
}

export interface FriendServerToClientEvents {
  'friend:requestReceived': (payload: FriendRequestReceivedEvent) => void;
  'friend:requestAccepted': (payload: FriendRequestAcceptedEvent) => void;
  'friend:requestDeclined': (payload: FriendRequestDeclinedEvent) => void;
  'friend:removed': (payload: FriendRemovedEvent) => void;
  'friend:requestCancelled': (payload: FriendRequestCancelledEvent) => void
}