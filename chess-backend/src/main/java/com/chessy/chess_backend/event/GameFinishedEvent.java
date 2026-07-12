package com.chessy.chess_backend.event;

import java.util.UUID;

/** Published whenever a game transitions out of IN_PROGRESS (any end reason). */
public record GameFinishedEvent(UUID gameId) {
}