package com.chessy.chess_backend.event;

import java.time.Instant;
import java.util.UUID;

/** Published whenever a game's currentPlayerDeadlineAt is set or updated (i.e. after a move). */
public record GameDeadlineScheduledEvent(UUID gameId, Instant deadline) {
}