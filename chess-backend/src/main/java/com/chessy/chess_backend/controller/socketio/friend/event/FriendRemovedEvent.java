package com.chessy.chess_backend.controller.socketio.friend.event;

public class FriendRemovedEvent {
    private String friendshipId;

    public FriendRemovedEvent(String friendshipId) {
        this.friendshipId = friendshipId;
    }

    public String getFriendshipId() { return friendshipId; }
}