package com.chessy.chess_backend.config;

import com.chessy.chess_backend.controller.websocket.TestWebSocketHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(testWebSocketHandler(), "/ws/test").setAllowedOrigins("*");
    }

    @Bean
    public TestWebSocketHandler testWebSocketHandler() {
        return new TestWebSocketHandler();
    }
}