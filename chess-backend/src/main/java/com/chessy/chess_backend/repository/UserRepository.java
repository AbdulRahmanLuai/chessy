package com.chessy.chess_backend.repository;

import com.chessy.chess_backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    Optional<User> findByGoogleId(String googleId);
    boolean existsByEmail(String email);
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
}