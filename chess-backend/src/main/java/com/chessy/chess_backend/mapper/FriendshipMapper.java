package com.chessy.chess_backend.mapper;

import com.chessy.chess_backend.dto.friendship.FriendshipDto;
import com.chessy.chess_backend.entity.Friendship;
import com.chessy.chess_backend.entity.User;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class FriendshipMapper {

    public FriendshipDto toDto(Friendship friendship, UUID viewerId) {
        User other = friendship.getUser1().getId().equals(viewerId)
                ? friendship.getUser2()
                : friendship.getUser1();

        return FriendshipDto.builder()
                .id(friendship.getId())
                .otherUserId(other.getId())
                .otherUsername(other.getUsername())
                .otherDisplayName(other.getDisplayName())
                .requesterId(friendship.getRequester().getId())
                .status(friendship.getStatus().name())
                .createdAt(friendship.getCreatedAt())
                .build();
    }
}