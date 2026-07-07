package com.chessy.chess_backend.repository;

import com.chessy.chess_backend.entity.Friendship;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface FriendshipRepository extends JpaRepository<Friendship, UUID> {

    @Query("SELECT f FROM Friendship f WHERE " +
            "(f.user1.id = :id1 AND f.user2.id = :id2) OR " +
            "(f.user1.id = :id2 AND f.user2.id = :id1)")
    Optional<Friendship> findByUserPair(@Param("id1") UUID id1, @Param("id2") UUID id2);

    @Query("SELECT f FROM Friendship f WHERE " +
            "(f.user1.id = :userId OR f.user2.id = :userId) AND f.status = 'ACCEPTED'")
    Page<Friendship> findAllAcceptedForUser(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT f FROM Friendship f WHERE " +
            "(f.user1.id = :userId OR f.user2.id = :userId) " +
            "AND f.status = 'PENDING' AND f.requester.id <> :userId")
    Page<Friendship> findIncomingPending(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT f FROM Friendship f WHERE f.requester.id = :userId AND f.status = 'PENDING'")
    Page<Friendship> findOutgoingPending(@Param("userId") UUID userId, Pageable pageable);
}