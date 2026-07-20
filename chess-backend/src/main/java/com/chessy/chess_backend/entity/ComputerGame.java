package com.chessy.chess_backend.entity;

import com.chessy.chess_backend.model.enums.computerGame.Difficulty;
import com.chessy.chess_backend.model.enums.gameGeneral.GameResultReason;
import com.chessy.chess_backend.model.Move;
import com.chessy.chess_backend.model.enums.gameGeneral.GameStatus;
import com.chessy.chess_backend.model.enums.computerGame.UserColor;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "computer_games")
@Getter
@Setter
@NoArgsConstructor
public class ComputerGame {

    @Id
    @GeneratedValue
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "user_color", nullable = false)
    private UserColor userColor;

    @Column(name = "move_version", nullable = false)
    private Integer moveVersion = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private GameStatus status = GameStatus.IN_PROGRESS;

    @Column(name = "current_fen", nullable = false)
    private String currentFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

    @Column(name = "moves", columnDefinition = "jsonb", nullable = false)
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    private List<Move> moves = new ArrayList<>();

    @Column(name = "is_timed", nullable = false)
    private boolean timed;

    @Enumerated(EnumType.STRING)
    @Column(name = "difficulty", nullable = false)
    private Difficulty difficulty = Difficulty.EASY;

    @Column(name = "engine", nullable = false)
    private String engine = "RANDOM";

    @Column(name = "result")
    private String result;

    @Enumerated(EnumType.STRING)
    @Column(name = "result_reason")
    private GameResultReason resultReason;

    @Column(name = "time_initial_seconds")
    private Integer timeInitialSeconds;

    @Column(name = "time_increment_seconds")
    private Integer timeIncrementSeconds;

    @Column(name = "white_time_remaining_ms")
    private Long whiteTimeRemainingMs;

    @Column(name = "black_time_remaining_ms")
    private Long blackTimeRemainingMs;

    @Column(name = "last_move_at")
    private Instant lastMoveAt;

    @Column(name = "current_player_deadline_at")
    private Instant currentPlayerDeadlineAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "finished_at")
    private Instant finishedAt;

}