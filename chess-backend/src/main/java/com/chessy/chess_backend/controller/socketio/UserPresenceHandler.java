package com.chessy.chess_backend.controller.socketio;

import com.chessy.chess_backend.util.JwtUtil;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.annotation.OnConnect;
import com.corundumstudio.socketio.annotation.OnDisconnect;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

@Component
public class UserPresenceHandler {

    private final SocketIOServer server;
    private final JwtUtil jwtUtil;

    public UserPresenceHandler(SocketIOServer server, JwtUtil jwtUtil) {
        this.server = server;
        this.jwtUtil = jwtUtil;
    }

    @PostConstruct
    public void init() {
        server.addListeners(this);
    }

    @OnConnect
    public void onConnect(SocketIOClient client) {
        Object authToken = client.getHandshakeData().getAuthToken();

        if (authToken == null) {
            client.disconnect();
            return;
        }

        String jwt = ((Map<String, Object>) authToken).get("token").toString();

        if (!jwtUtil.validateToken(jwt)) {
            client.disconnect();
            return;
        }

        UUID userId = jwtUtil.extractUserId(jwt);
        client.set("userId", userId.toString());
        client.joinRoom("user:" + userId);
    }

    @OnDisconnect
    public void onDisconnect(SocketIOClient client) {
        String userId = client.get("userId");
        System.out.println("User " + userId + " disconnected: " + client.getSessionId());
    }

    
}