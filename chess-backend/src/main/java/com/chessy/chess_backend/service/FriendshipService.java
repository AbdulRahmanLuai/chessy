package com.chessy.chess_backend.service;

import com.chessy.chess_backend.dto.FriendshipDto;
import com.chessy.chess_backend.entity.Friendship;
import com.chessy.chess_backend.entity.User;
import com.chessy.chess_backend.mapper.FriendshipMapper;
import com.chessy.chess_backend.repository.FriendshipRepository;
import com.chessy.chess_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FriendshipService {

    // TODO: figure out case: user1 sends request to userb, but userb already sent request to usera.

    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;
    private final FriendshipMapper friendshipMapper;


    public Friendship sendRequest(UUID requesterId, UUID targetId) {
        if (requesterId.equals(targetId)) {
            throw new IllegalArgumentException("Cannot send a friend request to yourself");
        }

        Optional<Friendship> existingOpt = friendshipRepository.findByUserPair(requesterId, targetId);

        if (existingOpt.isPresent()) {
            Friendship existing = existingOpt.get();

            if (existing.getStatus() == Friendship.Status.ACCEPTED) {
                throw new IllegalStateException("You are already friends");
            }

            // PENDING case
            if (existing.getRequester().getId().equals(requesterId)) {
                // Same person re-sending their own still-pending request
                throw new IllegalStateException("Friend request already sent");
            }

            // The target had already sent a request to the requester — auto-accept it
            existing.setStatus(Friendship.Status.ACCEPTED);
            return friendshipRepository.save(existing);
        }

        User requester = userRepository.getById(requesterId);
        User target = userRepository.getById(targetId);

        User user1 = requesterId.compareTo(targetId) < 0 ? requester : target;
        User user2 = requesterId.compareTo(targetId) < 0 ? target : requester;

        Friendship friendship = Friendship.builder()
                .user1(user1)
                .user2(user2)
                .requester(requester)
                .status(Friendship.Status.PENDING)
                .build();

        return friendshipRepository.save(friendship);
    }

    public Friendship acceptRequest(UUID friendshipId, UUID accepterId) {
        Friendship friendship = getOwned(friendshipId, accepterId);

        if (friendship.getStatus() != Friendship.Status.PENDING) {
            throw new IllegalStateException("Request is not pending");
        }
        if (friendship.getRequester().getId().equals(accepterId)) {
            throw new IllegalStateException("Cannot accept your own request");
        }

        friendship.setStatus(Friendship.Status.ACCEPTED);
        return friendshipRepository.save(friendship);
    }

    public Friendship declineRequest(UUID friendshipId, UUID declinerId) {
        Friendship friendship = getOwned(friendshipId, declinerId);

        if (friendship.getStatus() != Friendship.Status.PENDING) {
            throw new IllegalStateException("Request is not pending");
        }

        friendshipRepository.delete(friendship);
        return friendship; // detached, but still holds the data we need
    }

    public Friendship removeFriend(UUID friendshipId, UUID requesterId) {
        Friendship friendship = getOwned(friendshipId, requesterId);

        if (friendship.getStatus() != Friendship.Status.ACCEPTED) {
            throw new IllegalStateException("Not currently friends");
        }

        friendshipRepository.delete(friendship);
        return friendship;
    }

    public Page<FriendshipDto> getFriends(UUID userId, Pageable pageable) {
        return friendshipRepository.findAllAcceptedForUser(userId, pageable)
                .map(f -> friendshipMapper.toDto(f, userId));
    }

    public Page<FriendshipDto> getIncomingRequests(UUID userId, Pageable pageable) {
        return friendshipRepository.findIncomingPending(userId, pageable)
                .map(f -> friendshipMapper.toDto(f, userId));
    }

    public Page<FriendshipDto> getOutgoingRequests(UUID userId, Pageable pageable) {
        return friendshipRepository.findOutgoingPending(userId, pageable)
                .map(f -> friendshipMapper.toDto(f, userId));
    }

    /** Loads a friendship and verifies the given user is actually part of it. */
    private Friendship getOwned(UUID friendshipId, UUID userId) {
        Friendship friendship = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new RuntimeException("Friendship not found"));

        boolean isParty = friendship.getUser1().getId().equals(userId)
                || friendship.getUser2().getId().equals(userId);

        if (!isParty) {
            throw new IllegalStateException("Not part of this friendship");
        }

        return friendship;
    }
}