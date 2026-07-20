package com.chessy.chess_backend.config;

import com.chessy.chess_backend.event.auth.SocketAuthenticatedEvent;
import com.chessy.chess_backend.util.JwtUtil;
import com.chessy.chess_backend.util.SocketAuthUtil;
import com.corundumstudio.socketio.AuthTokenResult;
import com.corundumstudio.socketio.AuthorizationResult;
import com.corundumstudio.socketio.Configuration;
import com.corundumstudio.socketio.SocketIOServer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Bean;

import java.util.UUID;

@org.springframework.context.annotation.Configuration
public class SocketIOConfig {

    @Bean
    public SocketIOServer socketIOServer(
            @Value("${app.frontend-url}") String frontendUrl,
            JwtUtil jwtUtil,
            ApplicationEventPublisher eventPublisher) {

        Configuration config = new Configuration();
        config.setHostname("localhost");
        config.setPort(9092);
        config.setOrigin(frontendUrl);

        config.setAuthorizationListener(handshakeData -> AuthorizationResult.SUCCESSFUL_AUTHORIZATION);

        SocketIOServer server = new SocketIOServer(config);

        server.getNamespace("").addAuthTokenListener((authData, client) -> {
            String token = SocketAuthUtil.extractTokenFromAuthData(authData);
            if (token == null || !jwtUtil.validateToken(token)) {
                return new AuthTokenResult(false, "Invalid or missing token");
            }

            UUID userId = jwtUtil.extractUserId(token);
            client.set("userId", userId);
            client.joinRoom("user:" + userId);

            eventPublisher.publishEvent(new SocketAuthenticatedEvent(client, userId));

            return AuthTokenResult.AuthTokenResultSuccess;
        });

        return server;
    }
}