package com.chessy.chess_backend.dto;

import com.chessy.chess_backend.model.Move;
import lombok.*;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MoveListDto {

    private UUID gameId;
    private List<MoveDto> moves;
}