package com.chessy.chess_backend.dto;

import lombok.*;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlayerDto {

    private UUID id;
    private String username;
    private String displayName;
}