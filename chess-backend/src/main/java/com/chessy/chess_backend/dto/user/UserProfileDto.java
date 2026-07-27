package com.chessy.chess_backend.dto.user;

import lombok.Builder;
import lombok.Value;

import java.time.Instant;
import java.util.UUID;

@Value
@Builder
public class UserProfileDto {
    UUID id;
    String username;
    String displayName;
    Instant createdAt;
}