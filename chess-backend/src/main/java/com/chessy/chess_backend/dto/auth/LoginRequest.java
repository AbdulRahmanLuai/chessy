package com.chessy.chess_backend.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank
    private String login;   // email or username
    @NotBlank
    private String password;
}