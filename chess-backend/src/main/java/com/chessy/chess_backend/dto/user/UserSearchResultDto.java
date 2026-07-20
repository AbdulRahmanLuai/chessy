package com.chessy.chess_backend.dto.user;

import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
public class UserSearchResultDto {
    private UUID id;
    private String username;
    private String displayName;
}