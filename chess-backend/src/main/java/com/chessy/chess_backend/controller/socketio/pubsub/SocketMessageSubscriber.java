package com.chessy.chess_backend.controller.socketio.pubsub;

import com.corundumstudio.socketio.SocketIOServer;
import jakarta.annotation.PostConstruct;
import org.redisson.api.RTopic;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class SocketMessageSubscriber {

    private final SocketIOServer server;
    private final RTopic userEventsTopic;

    public SocketMessageSubscriber(SocketIOServer server, RTopic userEventsTopic) {
        this.server = server;
        this.userEventsTopic = userEventsTopic;
    }

    @PostConstruct
    public void init() {
        userEventsTopic.addListener(SocketMessage.class, (channel, event) -> dispatch(event));
    }

    private void dispatch(SocketMessage event) {
        for (UUID userId : event.getTargetUserIds()) {
            server.getRoomOperations("user:" + userId).sendEvent(event.getEventType(), event.getPayload());
        }
    }
}