package com.chessy.chess_backend.mapper;

import com.chessy.chess_backend.dto.gameGeneral.MoveDto;
import com.chessy.chess_backend.model.Move;
import org.springframework.stereotype.Component;

@Component
public class MoveMapper {

    public MoveDto toDto(Move m) {
        return new MoveDto(
                m.getFrom(),
                m.getTo(),
                m.getSan(),
                m.getColor(),
                m.getTs(),
                m.getPromotion()
        );
    }
}