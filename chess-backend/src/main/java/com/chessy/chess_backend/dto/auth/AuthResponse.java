package com.chessy.chess_backend.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String accessToken;
    private String userId;
    private String email;
    private String displayName;
    private String username;
}