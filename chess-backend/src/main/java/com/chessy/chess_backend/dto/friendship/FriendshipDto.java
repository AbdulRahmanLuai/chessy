package com.chessy.chess_backend.dto.friendship;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
public class FriendshipDto {
    private UUID id;
    private UUID otherUserId;      // the "other" party from the caller's perspective
    private String otherUsername;
    private String otherDisplayName;
    private UUID requesterId;      // who sent the request
    private String status;         // "PENDING" | "ACCEPTED"
    private Instant createdAt;
}