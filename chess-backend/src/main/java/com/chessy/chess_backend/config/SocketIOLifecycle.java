package com.chessy.chess_backend.config;

import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.annotation.OnConnect;
import com.corundumstudio.socketio.annotation.OnDisconnect;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.springframework.stereotype.Component;

@Component
public class SocketIOLifecycle {

    private final SocketIOServer socketIOServer;

    public SocketIOLifecycle(SocketIOServer socketIOServer) {
        this.socketIOServer = socketIOServer;
    }

    @PostConstruct
    public void start() {
        socketIOServer.addListeners(this);
        socketIOServer.start();
    }

    @PreDestroy
    public void stop() {
        socketIOServer.stop();
    }

    @OnConnect
    public void onConnect(SocketIOClient client) {
        System.out.println(System.nanoTime() + " Connected: " + client.getSessionId());
    }

    @OnDisconnect
    public void onDisconnect(SocketIOClient client) {
        System.out.println(System.nanoTime() + " Disconnected: " + client.getSessionId() +
                ", userId: " + client.get("userId"));
    }
}