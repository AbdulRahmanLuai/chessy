package com.chessy.chess_backend.controller.socketio.computerGame;

import com.chessy.chess_backend.controller.socketio.computerGame.event.ComputerGameEndedEvent;
import com.chessy.chess_backend.dto.computerGame.ComputerGameDto;
import com.chessy.chess_backend.dto.computerGame.ComputerGameEndResult;
import com.chessy.chess_backend.dto.computerGame.ComputerGameMoveResult;
import com.chessy.chess_backend.exception.ComputerGameTimedOutException;
import com.chessy.chess_backend.service.ComputerGameService;
import com.corundumstudio.socketio.SocketIOServer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ComputerGameEventBroadcaster {

    private final SocketIOServer server;
    private final ComputerGameService computerGameService;

    public UUID getPlayerId(ComputerGameDto game) {
        return game.getUserId();
    }

    public UUID getPlayerId(UUID gameId) {
        return getPlayerId(computerGameService.getGame(gameId));
    }

    public void sendToPlayer(UUID userId, String eventName, Object event) {
        server.getRoomOperations("user:" + userId.toString()).sendEvent(eventName, event);
    }

    public ComputerGameEndedEvent toGameEndedEvent(ComputerGameEndResult endResult) {
        return new ComputerGameEndedEvent(
                endResult.getGameId().toString(),
                endResult.getResult(),
                endResult.getWinner() == null ? "DRAW" : endResult.getWinner().toString(),
                endResult.getResultReason().toString()
        );
    }

    public void broadcastGameEnded(ComputerGameEndResult endResult) {
        UUID userId = getPlayerId(endResult.getGameId());
        sendToPlayer(userId, "computerGame:ended", toGameEndedEvent(endResult));
    }

    public void broadcastMoveApplied(ComputerGameMoveResult result) {
        UUID userId = getPlayerId(result.getGame());

        sendToPlayer(userId, "computerGame:moveApplied", result.getMoveEvent());
        if (result.getEndResult() != null) {
            sendToPlayer(userId, "computerGame:ended", toGameEndedEvent(result.getEndResult()));
        }
    }

    public void broadcastFailure(UUID gameId, Exception e) {
        UUID userId = getPlayerId(gameId);
        sendToPlayer(userId, "computerGame:botMoveFailed", e.getMessage());
    }

    public void broadcastTimeout(UUID gameId, ComputerGameTimedOutException e) {
    }
}