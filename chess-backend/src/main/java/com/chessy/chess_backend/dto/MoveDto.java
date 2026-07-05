package com.chessy.chess_backend.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MoveDto {
    private String from;
    private String to;
    private String san;
    private String color;
    private long ts;
    private String promotion;
}