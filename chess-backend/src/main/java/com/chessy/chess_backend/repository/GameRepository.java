package com.chessy.chess_backend.repository;

import com.chessy.chess_backend.entity.Game;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface GameRepository extends JpaRepository<Game, UUID> {

    @Query("SELECT COUNT(g) > 0 FROM Game g " +
            "WHERE (g.whitePlayer.id = :userId OR g.blackPlayer.id = :userId) " +
            "AND g.status IN ('WAITING', 'IN_PROGRESS')")
    boolean hasActiveGame(@Param("userId") UUID userId);
}