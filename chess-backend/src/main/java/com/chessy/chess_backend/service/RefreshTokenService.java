package com.chessy.chess_backend.service;

import com.chessy.chess_backend.entity.RefreshToken;
import com.chessy.chess_backend.repository.RefreshTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.UUID;

@Service
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final int refreshTokenExpirationDays;

    public RefreshTokenService(
            RefreshTokenRepository refreshTokenRepository,
            PasswordEncoder passwordEncoder,
            @Value("${jwt.refresh-expiration-days:30}") int refreshTokenExpirationDays) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.refreshTokenExpirationDays = refreshTokenExpirationDays;
    }

    /**
     * Generate a new refresh token for a user. Deletes old token if exists.
     * @return raw token (will be set as cookie by controller)
     */
    @Transactional
    public String generateRefreshToken(UUID userId) {
        // Find existing or create new
        RefreshToken entity = refreshTokenRepository.findByUserId(userId)
                .orElse(RefreshToken.builder().userId(userId).build());

        // Generate new raw token and hash
        byte[] randomBytes = new byte[32];
        new SecureRandom().nextBytes(randomBytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
        String tokenHash = hashToken(rawToken);  // SHA-256

        // Update fields
        entity.setTokenHash(tokenHash);
        entity.setExpiresAt(Instant.now().plus(refreshTokenExpirationDays, ChronoUnit.DAYS));

        refreshTokenRepository.save(entity);  // insert if new, update if existing
        return rawToken;
    }

    /**
     * Validate a raw refresh token, rotate it, and return new raw token + the userId.
     * @param rawRefreshToken from the cookie
     * @return new raw token and userId if valid, or null
     */
    @Transactional
    public RefreshTokenResult validateAndRotate(String rawRefreshToken) {
        String tokenHash = hashToken(rawRefreshToken); // deterministic
        RefreshToken stored = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElse(null);
        if (stored == null) return null;

        if (stored.getExpiresAt().isBefore(Instant.now())) {
            refreshTokenRepository.delete(stored);
            return null;
        }

        UUID userId = stored.getUserId();
        String newRawToken = generateRefreshToken(userId); // this will delete old and create new
        return new RefreshTokenResult(newRawToken, userId);
    }

    private String hashToken(String rawToken) {
        // SHA-256 deterministic hash for lookup
        try {
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(rawToken.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    @Transactional
    public void invalidateToken(String rawToken) {
        String tokenHash = hashToken(rawToken);
        refreshTokenRepository.findByTokenHash(tokenHash)
                .ifPresent(refreshTokenRepository::delete);
    }

    public record RefreshTokenResult(String newRawToken, UUID userId) {}
}