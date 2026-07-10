package com.chessy.chess_backend.event;

import com.corundumstudio.socketio.SocketIOClient;
import org.springframework.context.ApplicationEvent;

import java.util.UUID;

public class SocketAuthenticatedEvent extends ApplicationEvent {

    private final SocketIOClient client;
    private final UUID userId;

    public SocketAuthenticatedEvent(SocketIOClient client, UUID userId) {
        super(client);
        this.client = client;
        this.userId = userId;
    }

    public SocketIOClient getClient() { return client; }
    public UUID getUserId() { return userId; }
}