package com.chessy.chess_backend.controller.socketio.pubsub;

import java.io.Serializable;
import java.util.List;
import java.util.UUID;

public class SocketMessage implements Serializable {
    private String eventType;
    private List<UUID> targetUserIds;
    private Object payload;

    public SocketMessage() {
    }

    public SocketMessage(String eventType, List<UUID> targetUserIds, Object payload) {
        this.eventType = eventType;
        this.targetUserIds = targetUserIds;
        this.payload = payload;
    }

    public String getEventType() {
        return eventType;
    }

    public List<UUID> getTargetUserIds() {
        return targetUserIds;
    }

    public Object getPayload() {
        return payload;
    }
}