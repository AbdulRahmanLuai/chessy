package com.chessy.chess_backend.controller.socketio.friend.event;

public class FriendRequestDeclinedEvent {
    private String friendshipId;

    public FriendRequestDeclinedEvent(String friendshipId) {
        this.friendshipId = friendshipId;
    }

    public String getFriendshipId() { return friendshipId; }
}