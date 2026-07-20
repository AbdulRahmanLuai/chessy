package com.chessy.chess_backend.event.computerGame;

import java.time.Instant;
import java.util.UUID;

public record ComputerGameDeadlineScheduledEvent(UUID gameId, Instant deadline) {}
