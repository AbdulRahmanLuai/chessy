package com.chessy.chess_backend.controller.socketio.computerGame;

import com.chessy.chess_backend.controller.socketio.computerGame.payload.ComputerGameActionPayload;
import com.chessy.chess_backend.controller.socketio.computerGame.payload.ComputerGameMovePayload;
import com.chessy.chess_backend.dto.computerGame.ComputerGameEndResult;
import com.chessy.chess_backend.dto.computerGame.ComputerGameMoveResult;
import com.chessy.chess_backend.exception.*;
import com.chessy.chess_backend.model.enums.computerGame.MoveSource;
import com.chessy.chess_backend.service.ComputerGameService;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.annotation.OnEvent;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class ComputerGameSocketController {

    private final SocketIOServer server;
    private final ComputerGameService computerGameService;
    private final ComputerGameEventBroadcaster broadcaster;

    public ComputerGameSocketController(SocketIOServer server, ComputerGameService computerGameService, ComputerGameEventBroadcaster broadcaster) {
        this.server = server;
        this.computerGameService = computerGameService;
        this.broadcaster = broadcaster;
    }

    @PostConstruct
    public void init() {
        server.addListeners(this);
    }

    @OnEvent("computerGame:move")
    public void onMove(SocketIOClient client, ComputerGameMovePayload payload) {
        UUID userId = requireAuth(client);
        if (userId == null) return;

        UUID gameId = UUID.fromString(payload.getGameId());
        ComputerGameMoveResult result;
        try {
            result = computerGameService.applyMove(gameId, userId, payload, MoveSource.USER);
        } catch (ComputerGameTimedOutException e) {
            handleTimeout(client, e);
            return;
        } catch (GameNotFoundException | IllegalMoveException | MoveNotationException | NotYourTurnException |
                 NotAParticipantException | IllegalGameStateException | GameConcurrentModificationException e) {
            client.sendEvent("computerGame:error", e.getMessage());
            return;
        }

        broadcaster.broadcastMoveApplied(result);
    }

    @OnEvent("computerGame:resign")
    public void onResign(SocketIOClient client, ComputerGameActionPayload payload) {
        UUID userId = requireAuth(client);
        if (userId == null) return;

        UUID gameId = UUID.fromString(payload.getGameId());
        ComputerGameEndResult endResult;
        try {
            endResult = computerGameService.resignGame(gameId, userId);
        } catch (ComputerGameTimedOutException e) {
            handleTimeout(client, e);
            return;
        } catch (GameNotFoundException | NotAParticipantException | IllegalGameStateException |
                 GameConcurrentModificationException e) {
            client.sendEvent("computerGame:error", e.getMessage());
            return;
        }

        broadcaster.broadcastGameEnded(endResult);
    }

    @OnEvent("computerGame:abort")
    public void onAbort(SocketIOClient client, ComputerGameActionPayload payload) {
        UUID userId = requireAuth(client);
        if (userId == null) return;

        UUID gameId = UUID.fromString(payload.getGameId());
        ComputerGameEndResult endResult;
        try {
            endResult = computerGameService.abortGame(gameId, userId);
        } catch (ComputerGameTimedOutException e) {
            handleTimeout(client, e);
            return;
        } catch (GameNotFoundException | NotAParticipantException | IllegalGameStateException |
                 GameConcurrentModificationException e) {
            client.sendEvent("computerGame:error", e.getMessage());
            return;
        }

        broadcaster.broadcastGameEnded(endResult);
    }

    private UUID requireAuth(SocketIOClient client) {
        UUID userId = client.get("userId");
        if (userId == null) {
            client.sendEvent("computerGame:error", "Not authenticated");
        }
        return userId;
    }

    private void handleTimeout(SocketIOClient client, ComputerGameTimedOutException e) {
        client.sendEvent("computerGame:error", e.getMessage());
        // ComputerGameTimedOutException already carries a ready-to-broadcast
        // ComputerGameEndResult — no cross-DTO conversion needed here, unlike
        // the online-game path which maps from the general GameEndResult.
        broadcaster.broadcastGameEnded(e.getEndResult());
    }

}