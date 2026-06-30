package com.chessy.chess_backend.repository;

import com.chessy.chess_backend.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
    Optional<RefreshToken> findByUserId(UUID userId);
    Optional<RefreshToken> findByTokenHash(String tokenHash);
}