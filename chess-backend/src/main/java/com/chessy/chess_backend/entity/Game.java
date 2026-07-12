package com.chessy.chess_backend.entity;


import com.chessy.chess_backend.converter.MoveListConverter;

import com.chessy.chess_backend.model.Move;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "games")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Game {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "white_player_id")
    private User whitePlayer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "black_player_id")
    private User blackPlayer;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private GameStatus status;

    @Column(name = "current_fen", nullable = false)
    private String currentFen;



    @Column(name = "moves", columnDefinition = "jsonb")
    @Convert(converter = MoveListConverter.class)
    @JdbcTypeCode(SqlTypes.JSON)
    private List<Move> moves = new ArrayList<>();
    private String result;

    @Column(name = "result_reason", length = 30)
    private String resultReason;

    @Column(name = "time_initial_seconds", nullable = false)
    private Integer timeInitialSeconds;

    @Column(name = "time_increment_seconds", nullable = false)
    private Integer timeIncrementSeconds;

    @Column(name = "white_time_remaining_ms", nullable = false)
    private Long whiteTimeRemainingMs;

    @Column(name = "black_time_remaining_ms", nullable = false)
    private Long blackTimeRemainingMs;

    @Column(name = "last_move_at")
    private Instant lastMoveAt;

    @Column(name = "current_player_deadline_at")
    private Instant currentPlayerDeadlineAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "finished_at")
    private Instant finishedAt;

    @Column(name = "winner")
    private UUID winner;

    @Column(name = "pending_draw_offered_by")
    private UUID pendingDrawOfferedBy;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public enum GameStatus {
        WAITING, IN_PROGRESS, COMPLETED, ABORTED
    }
}