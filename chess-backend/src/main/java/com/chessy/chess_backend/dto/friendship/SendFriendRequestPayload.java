package com.chessy.chess_backend.dto.friendship;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class SendFriendRequestPayload {
    private UUID targetUserId;
}