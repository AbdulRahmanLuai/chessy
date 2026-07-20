package com.chessy.chess_backend.dto.onlineGame;

import lombok.*;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateGameResponseDto {

    private UUID gameId;
}