package com.chessy.chess_backend.controller.socketio.game;

import com.chessy.chess_backend.controller.socketio.game.event.*;
import com.chessy.chess_backend.controller.socketio.game.payload.GameActionPayload;
import com.chessy.chess_backend.controller.socketio.game.payload.JoinGamePayload;
import com.chessy.chess_backend.controller.socketio.game.payload.LeaveGamePayload;
import com.chessy.chess_backend.controller.socketio.game.payload.MovePayload;
import com.chessy.chess_backend.dto.GameDto;
import com.chessy.chess_backend.dto.GameEndResult;
import com.chessy.chess_backend.dto.GameMoveResult;
import com.chessy.chess_backend.dto.MoveDto;
import com.chessy.chess_backend.entity.Game;
import com.chessy.chess_backend.exception.*;
import com.chessy.chess_backend.service.GameService;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.annotation.OnDisconnect;
import com.corundumstudio.socketio.annotation.OnEvent;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Component
public class GameSocketController {

    //TODO: consider joining room with GameID?
    //TODO: handle race condition issues.


    private final SocketIOServer server;
    private final GameService gameService;
    private final GameEventBroadcaster broadcaster;

    public GameSocketController(SocketIOServer server, GameService gameService, GameEventBroadcaster broadcaster) {
        this.server = server;
        this.gameService = gameService;
        this.broadcaster = broadcaster;
    }

    @PostConstruct
    public void init() {
        server.addListeners(this);
    }

    @OnEvent("game:join")
    public void onJoinGame(SocketIOClient client, JoinGamePayload payload) {
        UUID userId = requireAuth(client);
        if (userId == null) return;

        UUID gameId = UUID.fromString(payload.getGameId());
        if (!validateParticipantOrError(client, gameId, userId)) return;

        broadcaster.broadcastUserJoined(gameId, userId);
    }

    @OnEvent("game:leave")
    public void onLeaveGame(SocketIOClient client, LeaveGamePayload payload) {
        UUID userId = requireAuth(client);
        if (userId == null) return;

        UUID gameId = UUID.fromString(payload.getGameId());
        if (!validateParticipantOrError(client, gameId, userId)) return;

        broadcaster.broadcastUserLeft(gameId, userId);
    }

    @OnEvent("game:move")
    public void onMove(SocketIOClient client, MovePayload payload) {
        UUID userId = requireAuth(client);
        if (userId == null) return;

        UUID gameId = UUID.fromString(payload.getGameId());
        GameMoveResult result;
        try {
            result = gameService.applyMove(gameId, userId, payload);
        } catch (GameTimedOutException e) {
            handleTimeout(client, e);
            return;
        } catch (GameNotFoundException | IllegalMoveException | MoveNotationException | NotYourTurnException |
                 NotAParticipantException | IllegalGameStateException e) {
            client.sendEvent("game:error", e.getMessage());
            return;
        }

        broadcaster.broadcastMoveApplied(result);
    }

    @OnEvent("game:resign")
    public void onResign(SocketIOClient client, GameActionPayload payload) {
        UUID userId = requireAuth(client);
        if (userId == null) return;

        UUID gameId = UUID.fromString(payload.getGameId());
        GameEndResult endResult;
        try {
            endResult = gameService.resignGame(gameId, userId);
        } catch (GameTimedOutException e) {
            handleTimeout(client, e);
            return;
        } catch (GameNotFoundException | NotAParticipantException | IllegalGameStateException e) {
            client.sendEvent("game:error", e.getMessage());
            return;
        }

        broadcaster.broadcastGameEnded(endResult);
    }

    @OnEvent("game:abort")
    public void onAbort(SocketIOClient client, GameActionPayload payload) {
        UUID userId = requireAuth(client);
        if (userId == null) return;

        UUID gameId = UUID.fromString(payload.getGameId());
        GameEndResult endResult;
        try {
            endResult = gameService.abortGame(gameId, userId);
        } catch (GameTimedOutException e) {
            handleTimeout(client, e);
            return;
        } catch (GameNotFoundException | NotAParticipantException | IllegalGameStateException e) {
            client.sendEvent("game:error", e.getMessage());
            return;
        }

        broadcaster.broadcastGameEnded(endResult);
    }

    @OnEvent("game:offerDraw")
    public void onOfferDraw(SocketIOClient client, GameActionPayload payload) {
        System.out.println("OfferDraw received by server");
        UUID userId = requireAuth(client);
        if (userId == null) return;

        UUID gameId = UUID.fromString(payload.getGameId());
        if (!validateParticipantOrError(client, gameId, userId)) return;

        gameService.offerDraw(gameId, userId);
        broadcaster.broadcastDrawOffered(gameId, userId);
    }

    @OnEvent("game:acceptDraw")
    public void onAcceptDraw(SocketIOClient client, GameActionPayload payload) {
        UUID userId = requireAuth(client);
        if (userId == null) return;

        UUID gameId = UUID.fromString(payload.getGameId());
        GameEndResult endResult;
        try {
            endResult = gameService.acceptDraw(gameId, userId);
        } catch (GameTimedOutException e) {
            handleTimeout(client, e);
            return;
        } catch (GameNotFoundException | NotAParticipantException | IllegalGameStateException e) {
            client.sendEvent("game:error", e.getMessage());
            return;
        }

        broadcaster.broadcastDrawAccepted(gameId, endResult);
    }

    @OnEvent("game:declineDraw")
    public void onDeclineDraw(SocketIOClient client, GameActionPayload payload) {
        UUID userId = requireAuth(client);
        if (userId == null) return;

        UUID gameId = UUID.fromString(payload.getGameId());
        if (!validateParticipantOrError(client, gameId, userId)) return;

        gameService.declineDraw(gameId, userId);
        broadcaster.broadcastDrawDeclined(gameId);
    }

    private UUID requireAuth(SocketIOClient client) {
        UUID userId = client.get("userId");
        if (userId == null) {
            client.sendEvent("game:error", "Not authenticated");
        }
        return userId;
    }


    private boolean validateParticipantOrError(SocketIOClient client, UUID gameId, UUID userId) {
        try {
            gameService.validateActiveParticipant(gameId, userId);
            return true;
        } catch (GameTimedOutException e) {
            handleTimeout(client, e);
            return false;
        } catch (GameNotFoundException | NotAParticipantException | IllegalGameStateException e) {
            client.sendEvent("game:error", e.getMessage());
            return false;
        }
    }

    private void handleTimeout(SocketIOClient client, GameTimedOutException e) {
        client.sendEvent("game:error", e.getMessage());
        broadcaster.broadcastGameEnded(e.getEndResult());
    }

}