package com.chessy.chess_backend.controller.socketio.friend.event;

public class FriendRequestReceivedEvent {
    private String friendshipId;
    private String fromUserId;
    private String fromUsername;

    public FriendRequestReceivedEvent(String friendshipId, String fromUserId, String fromUsername) {
        this.friendshipId = friendshipId;
        this.fromUserId = fromUserId;
        this.fromUsername = fromUsername;
    }

    public String getFriendshipId() { return friendshipId; }
    public String getFromUserId() { return fromUserId; }
    public String getFromUsername() { return fromUsername; }
}