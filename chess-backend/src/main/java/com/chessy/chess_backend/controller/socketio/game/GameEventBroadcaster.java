package com.chessy.chess_backend.controller.socketio.game;

import com.chessy.chess_backend.controller.socketio.game.event.*;
import com.chessy.chess_backend.dto.GameDto;
import com.chessy.chess_backend.dto.GameEndResult;
import com.chessy.chess_backend.dto.GameMoveResult;
import com.chessy.chess_backend.service.GameService;
import com.corundumstudio.socketio.SocketIOServer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class GameEventBroadcaster {

    private final SocketIOServer server;
    private final GameService gameService;

    public record PlayerIds(UUID white, UUID black) {
    }

    public PlayerIds getPlayerIds(GameDto game) {
        return new PlayerIds(game.getWhitePlayer().getId(), game.getBlackPlayer().getId());
    }

    public PlayerIds getPlayerIds(UUID gameId) {
        return getPlayerIds(gameService.getGame(gameId));
    }

    public void sendToPlayers(PlayerIds players, String eventName, Object event) {
        server.getRoomOperations("user:" + players.white().toString()).sendEvent(eventName, event);
        server.getRoomOperations("user:" + players.black().toString()).sendEvent(eventName, event);
    }

    public GameEndedEvent toGameEndedEvent(GameEndResult endResult) {
        return new GameEndedEvent(
                endResult.getGameId().toString(),
                endResult.getResult(),
                endResult.getWinner() == null ? "DRAW" : endResult.getWinner().toString(),
                endResult.getResultReason().toString()
        );
    }

    public void broadcastGameEnded(GameEndResult endResult) {
        PlayerIds players = getPlayerIds(endResult.getGameId());
        sendToPlayers(players, "game:ended", toGameEndedEvent(endResult));
    }

    public void broadcastUserJoined(UUID gameId, UUID userId) {
        PlayerIds players = getPlayerIds(gameId);
        sendToPlayers(players, "game:userJoined", new UserJoinedEvent(gameId.toString(), userId.toString()));
    }

    public void broadcastUserLeft(UUID gameId, UUID userId) {
        PlayerIds players = getPlayerIds(gameId);
        sendToPlayers(players, "game:userLeft", new UserLeftEvent(gameId.toString(), userId.toString()));
    }

    public void broadcastMoveApplied(GameMoveResult result) {
        PlayerIds players = getPlayerIds(result.getGame());

        sendToPlayers(players, "game:moveApplied", result.getMoveEvent());
        if (result.getEndResult() != null) {
            sendToPlayers(players, "game:ended", toGameEndedEvent(result.getEndResult()));
        }
    }
    public void broadcastDrawOffered(UUID gameId, UUID offeredByUserId) {
        PlayerIds players = getPlayerIds(gameId);
        sendToPlayers(players, "game:drawOffered", new DrawOfferedEvent(offeredByUserId.toString()));
    }

    /**
     * Preserves existing behavior: unlike every other game:ended broadcast,
     * an accepted draw reports winner as the literal string "DRAW" instead of
     * null. Not unified with toGameEndedEvent/broadcastGameEnded pending a
     * decision on whether that inconsistency should be fixed.
     */
    public void broadcastDrawAccepted(UUID gameId, GameEndResult endResult) {
        PlayerIds players = getPlayerIds(gameId);

        GameIdEvent acceptedEvent = new GameIdEvent(gameId.toString());
        GameEndedEvent endedEvent = new GameEndedEvent(
                gameId.toString(),
                endResult.getResult(),
                endResult.getWinner() == null ? "DRAW" : endResult.getWinner().toString(),
                endResult.getResultReason().toString()
        );

        sendToPlayers(players, "game:drawAccepted", acceptedEvent);
        sendToPlayers(players, "game:ended", endedEvent);
    }

    public void broadcastDrawDeclined(UUID gameId) {
        PlayerIds players = getPlayerIds(gameId);
        sendToPlayers(players, "game:declineDraw", new GameIdEvent(gameId.toString()));
    }

}