package com.chessy.chess_backend.controller.socketio.friend;

import com.chessy.chess_backend.controller.socketio.friend.event.*;
import com.chessy.chess_backend.controller.socketio.pubsub.SocketMessagePublisher;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
public class FriendSocketNotifier {

    private final SocketMessagePublisher socketMessagePublisher;

    public FriendSocketNotifier(SocketMessagePublisher socketMessagePublisher) {
        this.socketMessagePublisher = socketMessagePublisher;
    }

    public void notifyRequestReceived(UUID targetUserId, String friendshipId, String fromUserId, String fromUsername) {
        socketMessagePublisher.publish("friend:requestReceived", List.of(targetUserId),
                new FriendRequestReceivedEvent(friendshipId, fromUserId, fromUsername));
    }

    public void notifyRequestAccepted(UUID requesterId, String friendshipId, String byUserId) {
        socketMessagePublisher.publish("friend:requestAccepted", List.of(requesterId),
                new FriendRequestAcceptedEvent(friendshipId, byUserId));
    }

    public void notifyRequestDeclined(UUID requesterId, String friendshipId) {
        socketMessagePublisher.publish("friend:requestDeclined", List.of(requesterId),
                new FriendRequestDeclinedEvent(friendshipId));
    }

    public void notifyRequestCancelled(UUID recipientId, String friendshipId) {
        socketMessagePublisher.publish("friend:requestCancelled", List.of(recipientId),
                new FriendRequestCancelledEvent(friendshipId));
    }

    public void notifyFriendRemoved(UUID otherUserId, String friendshipId) {
        socketMessagePublisher.publish("friend:removed", List.of(otherUserId),
                new FriendRemovedEvent(friendshipId));
    }
}