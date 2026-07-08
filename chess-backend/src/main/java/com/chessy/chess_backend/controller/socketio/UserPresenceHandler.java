package com.chessy.chess_backend.controller.socketio;

import com.chessy.chess_backend.controller.socketio.challenge.ChallengeSocketController;
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
    private final ChallengeSocketController challengeSocketController;

    public UserPresenceHandler(SocketIOServer server, JwtUtil jwtUtil, ChallengeSocketController challengeSocketController) {
        this.server = server;
        this.jwtUtil = jwtUtil;
        this.challengeSocketController = challengeSocketController;
    }

    @PostConstruct
    public void init() {
        server.addListeners(this);
    }

    @OnConnect
    public void onConnect(SocketIOClient client) {
        String jwt = null;

        Object authToken = client.getHandshakeData().getAuthToken();
        if (authToken != null) {
            jwt = ((Map<String, Object>) authToken).get("token").toString();
        }

        if (jwt == null) {
            jwt = client.getHandshakeData().getSingleUrlParam("token");
        }

        if (jwt == null || !jwtUtil.validateToken(jwt)) {
            client.disconnect();
            return;
        }

        UUID userId = jwtUtil.extractUserId(jwt);
        client.set("userId", userId.toString());
        client.joinRoom("user:" + userId);
        challengeSocketController.deliverPendingChallenges(client, userId);
    }

    @OnDisconnect
    public void onDisconnect(SocketIOClient client) {
        // nothing needed; userId stored for future use
    }
}