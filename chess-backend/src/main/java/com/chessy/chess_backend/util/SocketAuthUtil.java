package com.chessy.chess_backend.util;

import com.corundumstudio.socketio.HandshakeData;

import java.util.Map;

public final class SocketAuthUtil {

    private SocketAuthUtil() {
    }

    public static String extractToken(HandshakeData handshakeData) {
        Object authToken = handshakeData.getAuthToken();
        if (authToken instanceof Map<?, ?> authMap) {
            Object token = authMap.get("token");
            if (token != null) {
                return token.toString();
            }
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    public static String extractTokenFromAuthData(Object authData) {
        if (!(authData instanceof Map)) return null;
        Object token = ((Map<String, Object>) authData).get("token");
        return token != null ? token.toString() : null;
    }
}