package com.chessy.chess_backend.controller.socketio.friend.event;

public class FriendRequestAcceptedEvent {
    private String friendshipId;
    private String byUserId;

    public FriendRequestAcceptedEvent(String friendshipId, String byUserId) {
        this.friendshipId = friendshipId;
        this.byUserId = byUserId;
    }

    public String getFriendshipId() { return friendshipId; }
    public String getByUserId() { return byUserId; }
}