package com.chessy.chess_backend.model;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Move {
    private String from;
    private String to;
    private String san;
    private String color;      // "w" or "b"
    private long ts;           // epoch ms
    private String promotion;  // optional
}