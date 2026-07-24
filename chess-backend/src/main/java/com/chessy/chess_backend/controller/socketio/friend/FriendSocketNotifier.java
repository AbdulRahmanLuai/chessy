package com.chessy.chess_backend.controller.socketio.friend;

import com.chessy.chess_backend.controller.socketio.friend.event.*;
import com.corundumstudio.socketio.SocketIOServer;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class FriendSocketNotifier {

    private final SocketIOServer server;

    public FriendSocketNotifier(SocketIOServer server) {
        this.server = server;
    }

    public void notifyRequestReceived(UUID targetUserId, String friendshipId, String fromUserId, String fromUsername) {
        server.getRoomOperations("user:" + targetUserId)
                .sendEvent("friend:requestReceived", new FriendRequestReceivedEvent(friendshipId, fromUserId, fromUsername));
    }

    public void notifyRequestAccepted(UUID requesterId, String friendshipId, String byUserId) {
        server.getRoomOperations("user:" + requesterId)
                .sendEvent("friend:requestAccepted", new FriendRequestAcceptedEvent(friendshipId, byUserId));
    }

    public void notifyRequestDeclined(UUID requesterId, String friendshipId) {
        server.getRoomOperations("user:" + requesterId)
                .sendEvent("friend:requestDeclined", new FriendRequestDeclinedEvent(friendshipId));
    }

    public void notifyRequestCancelled(UUID recipientId, String friendshipId) {
        server.getRoomOperations("user:" + recipientId)
                .sendEvent("friend:requestCancelled", new FriendRequestCancelledEvent(friendshipId));
    }

    public void notifyFriendRemoved(UUID otherUserId, String friendshipId) {
        server.getRoomOperations("user:" + otherUserId)
                .sendEvent("friend:removed", new FriendRemovedEvent(friendshipId));
    }
}