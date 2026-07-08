package com.chessy.chess_backend.config;

import com.corundumstudio.socketio.AuthorizationResult;
import com.corundumstudio.socketio.Configuration;
import com.corundumstudio.socketio.SocketIOServer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;

@org.springframework.context.annotation.Configuration
public class SocketIOConfig {

    @Bean
    public SocketIOServer socketIOServer(@Value("${app.frontend-url}") String frontendUrl) {
        Configuration config = new Configuration();
        config.setHostname("localhost");
        config.setPort(9092);
        config.setOrigin(frontendUrl);

        config.setAuthorizationListener(handshakeData ->
                AuthorizationResult.SUCCESSFUL_AUTHORIZATION);

        return new SocketIOServer(config);
    }
}