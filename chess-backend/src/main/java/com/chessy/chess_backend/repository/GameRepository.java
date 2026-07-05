package com.chessy.chess_backend.repository;

import com.chessy.chess_backend.entity.Game;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface GameRepository extends JpaRepository<Game, UUID> {
    // TODO add custom queries later if needed
}