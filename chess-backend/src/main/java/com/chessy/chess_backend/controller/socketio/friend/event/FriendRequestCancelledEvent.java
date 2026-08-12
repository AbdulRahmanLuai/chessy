package com.chessy.chess_backend.controller.socketio.friend.event;

public class FriendRequestCancelledEvent {
    private String friendshipId;

    public FriendRequestCancelledEvent() {
    }

    public FriendRequestCancelledEvent(String friendshipId) {
        this.friendshipId = friendshipId;
    }

    public String getFriendshipId() { return friendshipId; }
}
