package com.chessy.chess_backend.controller.socketio.pubsub;

import org.redisson.api.RTopic;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class SocketMessagePublisher {

    private final RTopic userEventsTopic;

    public SocketMessagePublisher(RTopic userEventsTopic) {
        this.userEventsTopic = userEventsTopic;
    }

    public void publish(String eventType, List<UUID> targetUserIds, Object payload) {
        userEventsTopic.publish(new SocketMessage(eventType, targetUserIds, payload));
    }
}