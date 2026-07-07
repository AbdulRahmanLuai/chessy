package com.chessy.chess_backend.controller.rest;

import com.chessy.chess_backend.controller.socketio.friend.FriendSocketNotifier;
import com.chessy.chess_backend.dto.FriendshipDto;
import com.chessy.chess_backend.dto.SendFriendRequestPayload;
import com.chessy.chess_backend.entity.Friendship;
import com.chessy.chess_backend.mapper.FriendshipMapper;
import com.chessy.chess_backend.security.CustomUserDetails;
import com.chessy.chess_backend.service.FriendshipService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
public class FriendshipController {

    private final FriendshipService friendshipService;
    private final FriendshipMapper friendshipMapper;
    private final FriendSocketNotifier friendSocketNotifier;

    @PostMapping("/requests")
    public FriendshipDto sendRequest(Authentication auth, @RequestBody SendFriendRequestPayload payload) {
        UUID requesterId = resolveUserId(auth);
        Friendship friendship = friendshipService.sendRequest(requesterId, payload.getTargetUserId());

        if (friendship.getStatus() == Friendship.Status.ACCEPTED) {
            // Auto-accepted a reverse pending request
            friendSocketNotifier.notifyRequestAccepted(
                    friendship.getRequester().getId(),
                    friendship.getId().toString(),
                    requesterId.toString()
            );
        } else {
            friendSocketNotifier.notifyRequestReceived(
                    payload.getTargetUserId(),
                    friendship.getId().toString(),
                    requesterId.toString(),
                    friendship.getRequester().getUsername()
            );
        }

        return friendshipMapper.toDto(friendship, requesterId);
    }

    @PostMapping("/requests/{friendshipId}/accept")
    public FriendshipDto acceptRequest(Authentication auth, @PathVariable UUID friendshipId) {
        UUID accepterId = resolveUserId(auth);
        Friendship friendship = friendshipService.acceptRequest(friendshipId, accepterId);

        friendSocketNotifier.notifyRequestAccepted(
                friendship.getRequester().getId(),
                friendship.getId().toString(),
                accepterId.toString()
        );

        return friendshipMapper.toDto(friendship, accepterId);
    }

    @PostMapping("/requests/{friendshipId}/decline")
    public void declineRequest(Authentication auth, @PathVariable UUID friendshipId) {
        UUID declinerId = resolveUserId(auth);

        Friendship friendship = friendshipService.declineRequest(friendshipId, declinerId);

        friendSocketNotifier.notifyRequestDeclined(
                friendship.getRequester().getId(),
                friendshipId.toString()
        );
    }

    @DeleteMapping("/{friendshipId}")
    public void removeFriend(Authentication auth, @PathVariable UUID friendshipId) {
        UUID userId = resolveUserId(auth);

        Friendship friendship = friendshipService.removeFriend(friendshipId, userId);

        UUID otherUserId = friendship.getUser1().getId().equals(userId)
                ? friendship.getUser2().getId()
                : friendship.getUser1().getId();

        friendSocketNotifier.notifyFriendRemoved(otherUserId, friendshipId.toString());
    }

    @GetMapping
    public Page<FriendshipDto> getFriends(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return friendshipService.getFriends(resolveUserId(auth), PageRequest.of(page, size));
    }

    @GetMapping("/requests/incoming")
    public Page<FriendshipDto> getIncomingRequests(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return friendshipService.getIncomingRequests(resolveUserId(auth), PageRequest.of(page, size));
    }

    @GetMapping("/requests/outgoing")
    public Page<FriendshipDto> getOutgoingRequests(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return friendshipService.getOutgoingRequests(resolveUserId(auth), PageRequest.of(page, size));
    }

    private UUID resolveUserId(Authentication auth) {
        CustomUserDetails principal = (CustomUserDetails) auth.getPrincipal();
        return principal.getId();
    }
}